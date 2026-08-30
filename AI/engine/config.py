"""
    config.py

    Hyperparameter and architecture configuration for LANZAR GPT models.

    Responsibilities:
    - Provide centralized dataclass for all transformer dimensions and training hyperparameters
    - Offer hardware-appropriate architectural presets (tiny, small, base)
    - Enable serialization to and from JSON/dict for checkpointing
"""

import json
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any


# =====================================
# Model Configuration Dataclass
# =====================================

@dataclass
class LanzarModelConfig:
    """
    Configuration parameters for LANZAR decoder-only transformer models.
    """
    # Architecture Dimensions
    vocab_size: int = 260          # 256 byte values + 4 special tokens (BOS, EOS, PAD, UNK)
    context_length: int = 128      # Maximum sequence length (T)
    d_model: int = 128             # Embedding dimension (hidden state size)
    n_layers: int = 4              # Number of stacked transformer blocks
    n_heads: int = 4               # Number of attention heads (d_model must be divisible by n_heads)
    d_ff: int = 512                # Feed-forward hidden dimension (typically 4 * d_model)
    dropout: float = 0.1           # Dropout probability for regularization
    bias: bool = True              # Whether to include bias terms in linear layers

    # Training Hyperparameters
    learning_rate: float = 5e-4    # Peak learning rate for AdamW
    weight_decay: float = 0.01     # Weight decay for regularization
    grad_clip: float = 1.0         # Maximum gradient norm for clipping
    batch_size: int = 16           # Batch size during training

    # Device & Execution
    device: str = "cpu"            # Target device: 'cpu' or 'cuda'
    model_name: str = "LANZAR-001" # Model identifier

    def __post_init__(self):
        # Ensure embedding dimension is evenly divisible by the number of attention heads
        if self.d_model % self.n_heads != 0:
            raise ValueError(
                f"d_model ({self.d_model}) must be divisible by n_heads ({self.n_heads})"
            )

    # =====================================
    # Architectural Presets
    # =====================================

    @classmethod
    def tiny(cls, device: str = "cpu") -> "LanzarModelConfig":
        """
        Ultra-compact configuration (~1.2M parameters).
        Ideal for rapid local experimentation, unit testing, and CPU execution.
        """
        return cls(
            vocab_size=260,
            context_length=128,
            d_model=128,
            n_layers=4,
            n_heads=4,
            d_ff=512,
            dropout=0.1,
            batch_size=16,
            learning_rate=5e-4,
            device=device,
            model_name="LANZAR-001-Tiny"
        )

    @classmethod
    def small(cls, device: str = "cpu") -> "LanzarModelConfig":
        """
        Small configuration (~9.5M parameters).
        Suitable for single GPU or capable multi-core CPU domain training.
        """
        return cls(
            vocab_size=260,
            context_length=256,
            d_model=256,
            n_layers=6,
            n_heads=8,
            d_ff=1024,
            dropout=0.1,
            batch_size=32,
            learning_rate=3e-4,
            device=device,
            model_name="LANZAR-001-Small"
        )

    # =====================================
    # Serialization
    # =====================================

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LanzarModelConfig":
        return cls(**data)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

    @classmethod
    def from_json(cls, json_str: str) -> "LanzarModelConfig":
        return cls.from_dict(json.loads(json_str))
