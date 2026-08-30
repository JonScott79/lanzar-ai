"""
    model_engine.py

    Unified High-Level Engine API Facade for LANZAR AI.

    Responsibilities:
    - Provide clean, decoupled interface between transformer neural engine and application layer
    - Manage model lifecycle, checkpoints, training runs, and inference queries
    - Provide telemetry (parameter count, hardware status, training state)
"""

import os
from typing import Optional, Dict, Any, Generator
from ..config import LanzarModelConfig
from ..model.transformer import LanzarGPT
from ..tokenizer.base import BaseTokenizer
from ..tokenizer.byte_tokenizer import ByteTokenizer
from ..training.trainer import LanzarTrainer
from ..training.checkpoint import CheckpointManager
from ..inference.generator import LanzarGenerator
from ..data.dataset import TextDataset
from ..data.dataloader import create_dataloader


# =====================================
# Main Model Engine Facade
# =====================================

class LanzarModelEngine:
    """
    Unified entry point for LANZAR AI models.
    """

    def __init__(
        self,
        config: Optional[LanzarModelConfig] = None,
        tokenizer: Optional[BaseTokenizer] = None,
        device: str = "cpu"
    ):
        self.device = device
        self.config = config or LanzarModelConfig.tiny(device=device)
        self.tokenizer = tokenizer or ByteTokenizer()

        self.model: Optional[LanzarGPT] = None
        self.generator: Optional[LanzarGenerator] = None

        self._init_model()

    def _init_model(self):
        """Instantiates neural model and generator."""
        self.model = LanzarGPT(self.config)
        self.model.to(self.device)
        self.generator = LanzarGenerator(self.model, self.tokenizer, device=self.device)

    # =====================================
    # Inference API
    # =====================================

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.8,
        top_k: int = 40,
        top_p: float = 0.9,
        include_prompt: bool = True
    ) -> str:
        """Generates text completion."""
        if not self.generator:
            raise RuntimeError("Model engine not initialized.")
        return self.generator.generate(
            prompt=prompt,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            include_prompt=include_prompt
        )

    def stream_generate(
        self,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.8
    ) -> Generator[str, None, None]:
        """Streams generated tokens."""
        if not self.generator:
            raise RuntimeError("Model engine not initialized.")
        yield from self.generator.stream_generate(
            prompt=prompt,
            max_new_tokens=max_new_tokens,
            temperature=temperature
        )

    # =====================================
    # Training API
    # =====================================

    def train_on_text(
        self,
        text: str,
        max_steps: int = 200,
        eval_interval: int = 25,
        checkpoint_dir: str = "checkpoints"
    ) -> Dict[str, Any]:
        """Trains model on a given text corpus."""
        dataset = TextDataset(
            text=text,
            tokenizer=self.tokenizer,
            context_length=self.config.context_length
        )
        loader = create_dataloader(dataset, batch_size=self.config.batch_size, shuffle=True)

        trainer = LanzarTrainer(
            model=self.model,
            config=self.config,
            train_loader=loader,
            checkpoint_dir=checkpoint_dir
        )
        results = trainer.train(max_steps=max_steps, eval_interval=eval_interval)
        return results

    # =====================================
    # Checkpointing API
    # =====================================

    def save_checkpoint(self, filepath: str, step: int = 0, loss: float = 0.0) -> str:
        """Saves current model weights to disk."""
        return CheckpointManager.save(
            model=self.model,
            optimizer=None,
            config=self.config,
            step=step,
            loss=loss,
            filepath=filepath
        )

    def load_checkpoint(self, filepath: str) -> Dict[str, Any]:
        """Loads model weights and configuration from disk."""
        self.model, self.config, metadata = CheckpointManager.load(filepath, device=self.device)
        self.generator = LanzarGenerator(self.model, self.tokenizer, device=self.device)
        return metadata

    # =====================================
    # Telemetry & Diagnostics
    # =====================================

    def get_stats(self) -> Dict[str, Any]:
        """Returns model metadata and parameter statistics."""
        return {
            "model_name": self.config.model_name,
            "device": self.device,
            "parameters_total": self.model.get_num_params(),
            "context_length": self.config.context_length,
            "vocab_size": self.config.vocab_size,
            "layers": self.config.n_layers,
            "heads": self.config.n_heads,
            "embedding_dim": self.config.d_model,
        }
