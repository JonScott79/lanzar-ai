"""
    attention.py

    Multi-Head Causal Self-Attention module for LANZAR AI transformer.

    Responsibilities:
    - Compute multi-head scaled dot-product attention with strict causal (autoregressive) masking
    - Project Queries, Keys, and Values efficiently in a single linear transformation
    - Apply attention dropout and output projection
"""

import math
import torch
import torch.nn as nn
from ..config import LanzarModelConfig


# =====================================
# Causal Multi-Head Self-Attention
# =====================================

class CausalSelfAttention(nn.Module):
    """
    Standard multi-head causal self-attention mechanism.
    Ensures each position can only attend to previous and current positions in the sequence.
    """

    def __init__(self, config: LanzarModelConfig):
        super().__init__()
        assert config.d_model % config.n_heads == 0, "d_model must be divisible by n_heads"

        self.d_model = config.d_model
        self.n_heads = config.n_heads
        self.head_dim = config.d_model // config.n_heads

        # Key, Query, Value projections combined into a single linear layer
        self.c_attn = nn.Linear(config.d_model, 3 * config.d_model, bias=config.bias)
        
        # Output projection
        self.c_proj = nn.Linear(config.d_model, config.d_model, bias=config.bias)
        
        # Regularization dropouts
        self.attn_dropout = nn.Dropout(config.dropout)
        self.resid_dropout = nn.Dropout(config.dropout)

        # Register triangular causal mask buffer (not a trainable parameter)
        # Shape: (1, 1, context_length, context_length)
        mask = torch.tril(torch.ones(config.context_length, config.context_length))
        self.register_buffer("mask", mask.view(1, 1, config.context_length, config.context_length))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, d_model)
        Returns:
            Output tensor of shape (batch_size, seq_len, d_model)
        """
        B, T, C = x.size()

        # 1. Compute Q, K, V
        qkv = self.c_attn(x)  # (B, T, 3 * C)
        q, k, v = qkv.split(self.d_model, dim=2)

        # 2. Reshape into multi-head format: (B, n_heads, T, head_dim)
        k = k.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        q = q.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)

        # 3. Scaled dot-product attention scores
        att = (q @ k.transpose(-2, -1)) * (1.0 / math.sqrt(self.head_dim))  # (B, nh, T, T)

        # 4. Apply causal mask (set future positions to -infinity)
        att = att.masked_fill(self.mask[:, :, :T, :T] == 0, float("-inf"))

        # 5. Softmax and dropout
        att = torch.softmax(att, dim=-1)
        att = self.attn_dropout(att)

        # 6. Weight values by attention
        y = att @ v  # (B, nh, T, head_dim)

        # 7. Concatenate heads back into (B, T, C)
        y = y.transpose(1, 2).contiguous().view(B, T, C)

        # 8. Output projection and residual dropout
        y = self.resid_dropout(self.c_proj(y))
        return y
