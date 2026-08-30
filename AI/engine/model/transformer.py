"""
    transformer.py

    Complete Decoder-Only GPT Transformer Architecture for LANZAR AI (LANZAR-001).

    Responsibilities:
    - Implement full GPT-style causal language model
    - Manage token & position embeddings, transformer stack, and final LM head
    - Compute cross-entropy loss during training and return logits during inference
    - Provide weight initialization and parameter counting
"""

import math
import torch
import torch.nn as nn
from typing import Optional, Tuple
from ..config import LanzarModelConfig
from .block import TransformerBlock


# =====================================
# LANZAR GPT Transformer Model
# =====================================

class LanzarGPT(nn.Module):
    """
    LANZAR-001 Decoder-Only Autoregressive Transformer.
    """

    def __init__(self, config: LanzarModelConfig):
        super().__init__()
        self.config = config

        self.transformer = nn.ModuleDict(dict(
            wte = nn.Embedding(config.vocab_size, config.d_model),
            wpe = nn.Embedding(config.context_length, config.d_model),
            drop = nn.Dropout(config.dropout),
            h = nn.ModuleList([TransformerBlock(config) for _ in range(config.n_layers)]),
            ln_f = nn.LayerNorm(config.d_model),
        ))

        self.lm_head = nn.Linear(config.d_model, config.vocab_size, bias=False)

        # Weight tying: share weights between input embedding and output projection
        # This significantly improves generalization and reduces parameter count
        self.transformer.wte.weight = self.lm_head.weight

        # Initialize all model weights
        self.apply(self._init_weights)

        # Apply special scaled initialization to residual projections (per GPT-2 paper)
        for pn, p in self.named_parameters():
            if pn.endswith("c_proj.weight"):
                torch.nn.init.normal_(p, mean=0.0, std=0.02 / math.sqrt(2 * config.n_layers))

    # =====================================
    # Weight Initialization
    # =====================================

    def _init_weights(self, module: nn.Module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
        elif isinstance(module, nn.LayerNorm):
            torch.nn.init.zeros_(module.bias)
            torch.nn.init.ones_(module.weight)

    # =====================================
    # Forward Pass
    # =====================================

    def forward(
        self,
        idx: torch.Tensor,
        targets: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        """
        Forward pass for training and inference.
        
        Args:
            idx: Tensor of token IDs with shape (batch_size, seq_len)
            targets: Optional ground-truth token IDs with shape (batch_size, seq_len)
            
        Returns:
            logits: Next-token unnormalized logits of shape (batch_size, seq_len, vocab_size)
            loss: Cross-entropy scalar loss (if targets is provided), else None
        """
        device = idx.device
        b, t = idx.size()

        if t > self.config.context_length:
            raise ValueError(
                f"Cannot forward sequence of length {t}, context_length is {self.config.context_length}"
            )

        # Positional indices [0, 1, ..., t-1]
        pos = torch.arange(0, t, dtype=torch.long, device=device).unsqueeze(0)  # Shape: (1, t)

        # Compute token embeddings and position embeddings
        tok_emb = self.transformer.wte(idx)  # (b, t, d_model)
        pos_emb = self.transformer.wpe(pos)  # (1, t, d_model)

        x = self.transformer.drop(tok_emb + pos_emb)

        # Pass through transformer blocks
        for block in self.transformer.h:
            x = block(x)

        # Final LayerNorm
        x = self.transformer.ln_f(x)

        # Compute next-token logits
        logits = self.lm_head(x)  # (b, t, vocab_size)

        loss = None
        if targets is not None:
            # Flatten batch and sequence dimensions for cross-entropy loss
            loss = nn.functional.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-1
            )

        return logits, loss

    # =====================================
    # Parameter Statistics
    # =====================================

    def get_num_params(self, non_embedding: bool = False) -> int:
        """
        Returns the total number of trainable parameters in the model.
        """
        n_params = sum(p.numel() for p in self.parameters() if p.requires_grad)
        if non_embedding:
            n_params -= self.transformer.wpe.weight.numel()
        return n_params
