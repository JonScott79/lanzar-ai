"""
    checkpoint.py

    Model checkpointing and serialization manager for LANZAR AI.

    Responsibilities:
    - Save model weights, optimizer state, configuration, and training step atomically
    - Restore complete training state to resume training or execute inference
    - Maintain standalone portability independent of the UI or runtime environment
"""

import os
import time
import torch
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from ..config import LanzarModelConfig
from ..model.transformer import LanzarGPT


# =====================================
# Checkpoint Manager Class
# =====================================

class CheckpointManager:
    """
    Manages saving and loading of LANZAR model checkpoints.
    """

    @staticmethod
    def save(
        model: LanzarGPT,
        optimizer: Optional[torch.optim.Optimizer],
        config: LanzarModelConfig,
        step: int,
        loss: float,
        filepath: str
    ) -> str:
        """
        Saves a complete training checkpoint.
        """
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        checkpoint_data = {
            "version": "1.0",
            "timestamp": time.time(),
            "step": step,
            "loss": loss,
            "config": config.to_dict(),
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict() if optimizer else None,
        }

        # Write to temporary file first, then atomic rename
        temp_path = str(path) + ".tmp"
        torch.save(checkpoint_data, temp_path)
        if os.path.exists(filepath):
            os.remove(filepath)
        os.rename(temp_path, filepath)

        return str(path)

    @staticmethod
    def load(
        filepath: str,
        device: str = "cpu"
    ) -> Tuple[LanzarGPT, LanzarModelConfig, Dict[str, Any]]:
        """
        Loads a checkpoint and instantiates the model with its saved configuration.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Checkpoint file not found: {filepath}")

        checkpoint = torch.load(filepath, map_location=device)
        config_data = checkpoint["config"]
        config = LanzarModelConfig.from_dict(config_data)
        config.device = device

        # Instantiate model with saved configuration and load weights
        model = LanzarGPT(config)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(device)

        metadata = {
            "step": checkpoint.get("step", 0),
            "loss": checkpoint.get("loss", 0.0),
            "timestamp": checkpoint.get("timestamp", 0),
            "optimizer_state_dict": checkpoint.get("optimizer_state_dict"),
        }

        return model, config, metadata
