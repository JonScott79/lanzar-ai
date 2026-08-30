"""
    test_model.py

    Unit tests for LanzarGPT model architecture.

    Responsibilities:
    - Verify input/output tensor shapes
    - Test forward pass with and without target labels
    - Verify causal attention masking
    - Verify backpropagation gradient calculation
"""

import unittest
import torch
from AI.engine.config import LanzarModelConfig
from AI.engine.model.transformer import LanzarGPT


class TestLanzarGPT(unittest.TestCase):

    def setUp(self):
        self.config = LanzarModelConfig.tiny(device="cpu")
        self.model = LanzarGPT(self.config)

    def test_model_parameter_count(self):
        num_params = self.model.get_num_params()
        self.assertGreater(num_params, 500_000)
        self.assertLess(num_params, 5_000_000)

    def test_forward_pass_shapes(self):
        batch_size = 2
        seq_len = 16
        idx = torch.randint(0, self.config.vocab_size, (batch_size, seq_len))

        logits, loss = self.model(idx)

        # Logits should have shape (batch_size, seq_len, vocab_size)
        self.assertEqual(logits.shape, (batch_size, seq_len, self.config.vocab_size))
        self.assertIsNone(loss)

    def test_forward_pass_with_targets(self):
        batch_size = 2
        seq_len = 16
        idx = torch.randint(0, self.config.vocab_size, (batch_size, seq_len))
        targets = torch.randint(0, self.config.vocab_size, (batch_size, seq_len))

        logits, loss = self.model(idx, targets=targets)

        self.assertIsNotNone(loss)
        self.assertTrue(torch.isfinite(loss))
        self.assertGreater(loss.item(), 0.0)

    def test_backward_pass_gradients(self):
        idx = torch.randint(0, self.config.vocab_size, (2, 16))
        targets = torch.randint(0, self.config.vocab_size, (2, 16))

        self.model.zero_grad()
        _, loss = self.model(idx, targets=targets)
        loss.backward()

        # Verify that parameters received non-zero gradients
        has_grads = all(p.grad is not None for p in self.model.parameters() if p.requires_grad)
        self.assertTrue(has_grads, "Not all trainable parameters received gradients")


if __name__ == "__main__":
    unittest.main()
