"""
    test_training.py

    Unit tests for LANZAR AI training engine and checkpointing.

    Responsibilities:
    - Test training loop step execution and loss reduction
    - Verify checkpoint save and load roundtrip
"""

import os
import tempfile
import unittest
import torch
from AI.engine.config import LanzarModelConfig
from AI.engine.model.transformer import LanzarGPT
from AI.engine.tokenizer.byte_tokenizer import ByteTokenizer
from AI.engine.data.dataset import TextDataset
from AI.engine.data.dataloader import create_dataloader
from AI.engine.training.trainer import LanzarTrainer
from AI.engine.training.checkpoint import CheckpointManager


class TestTraining(unittest.TestCase):

    def setUp(self):
        self.config = LanzarModelConfig.tiny(device="cpu")
        self.config.batch_size = 2
        self.tokenizer = ByteTokenizer()
        self.corpus = (
            "Penelope designed the rocket engine cooling jacket. "
            "Peter calculated the thermal gradient across the chamber. "
            "LANZAR AI synthesized the experimental telemetry data. "
        ) * 10

    def test_training_loss_reduction(self):
        dataset = TextDataset(self.corpus, self.tokenizer, context_length=32)
        loader = create_dataloader(dataset, batch_size=2, shuffle=True)

        model = LanzarGPT(self.config)
        trainer = LanzarTrainer(model, self.config, loader)

        results = trainer.train(max_steps=10, eval_interval=5, checkpoint_interval=100)
        self.assertEqual(results["total_steps"], 10)
        self.assertIsInstance(results["final_loss"], float)

    def test_checkpoint_save_and_load(self):
        model = LanzarGPT(self.config)
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

        with tempfile.TemporaryDirectory() as tmp_dir:
            ckpt_path = os.path.join(tmp_dir, "test_model.pt")
            saved_path = CheckpointManager.save(
                model=model,
                optimizer=optimizer,
                config=self.config,
                step=42,
                loss=1.234,
                filepath=ckpt_path
            )
            self.assertTrue(os.path.exists(saved_path))

            loaded_model, loaded_config, metadata = CheckpointManager.load(ckpt_path, device="cpu")
            self.assertEqual(metadata["step"], 42)
            self.assertAlmostEqual(metadata["loss"], 1.234, places=3)
            self.assertEqual(loaded_config.model_name, self.config.model_name)

            # Verify parameter equality
            for p1, p2 in zip(model.parameters(), loaded_model.parameters()):
                self.assertTrue(torch.equal(p1, p2))


if __name__ == "__main__":
    unittest.main()
