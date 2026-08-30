"""
    mlp.py

    Feed-Forward Multi-Layer Perceptron (MLP) for LANZAR AI transformer blocks.

    Responsibilities:
    - Apply non-linear token-wise feature transformation
    - Use Gaussian Error Linear Unit (GELU) activation
    - Expand to hidden feed-forward dimension (d_ff) and project back to d_model
"""

import torch
import torch.nn as nn
from ..config import LanzarModelConfig


# =====================================
# Transformer Feed-Forward Network
# =====================================

class MLP(nn.Module):
    """
    Position-wise feed-forward network with GELU activation.
    """

    def __init__(self, config: LanzarModelConfig):
        super().__init__()
        self.c_fc = nn.Linear(config.d_model, config.d_ff, bias=config.bias)
        self.gelu = nn.GELU()
        self.c_proj = nn.Linear(config.d_ff, config.d_model, bias=config.bias)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.c_fc(x)
        x = self.gelu(x)
        x = self.c_proj(x)
        x = self.dropout(x)
        return x
