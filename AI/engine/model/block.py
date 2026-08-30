"""
    block.py

    Transformer Block layer for LANZAR AI.

    Responsibilities:
    - Implement Pre-LayerNorm residual block architecture
    - Combine CausalSelfAttention and MLP with additive residual skip connections
"""

import torch
import torch.nn as nn
from ..config import LanzarModelConfig
from .attention import CausalSelfAttention
from .mlp import MLP


# =====================================
# Transformer Block Class
# =====================================

class TransformerBlock(nn.Module):
    """
    Standard Transformer Decoder Block using Pre-LayerNorm formulation:
        x = x + Attention(LayerNorm(x))
        x = x + MLP(LayerNorm(x))
    """

    def __init__(self, config: LanzarModelConfig):
        super().__init__()
        self.ln_1 = nn.LayerNorm(config.d_model)
        self.attn = CausalSelfAttention(config)
        self.ln_2 = nn.LayerNorm(config.d_model)
        self.mlp = MLP(config)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Pre-LN with residual connection
        x = x + self.attn(self.ln_1(x))
        x = x + self.mlp(self.ln_2(x))
        return x
