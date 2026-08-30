"""
    generator.py

    Autoregressive text generation engine for LANZAR AI.

    Responsibilities:
    - Perform causal next-token sampling with temperature, top-k, and top-p (nucleus) filtering
    - Provide both batch generation and real-time token streaming
    - Respect context window constraints and handle EOS termination
"""

import torch
import torch.nn.functional as F
from typing import Optional, Generator, List
from ..model.transformer import LanzarGPT
from ..tokenizer.base import BaseTokenizer


# =====================================
# Text Generator Class
# =====================================

class LanzarGenerator:
    """
    Inference and generation controller for LANZAR models.
    """

    def __init__(
        self,
        model: LanzarGPT,
        tokenizer: BaseTokenizer,
        device: str = "cpu"
    ):
        self.model = model
        self.tokenizer = tokenizer
        self.device = device
        self.model.to(self.device)
        self.model.eval()

    # =====================================
    # Text Generation
    # =====================================

    @torch.no_grad()
    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.8,
        top_k: Optional[int] = 40,
        top_p: Optional[float] = 0.9,
        stop_on_eos: bool = True,
        include_prompt: bool = True
    ) -> str:
        """
        Generates full continuation text given a prompt string.
        """
        # Encode prompt
        token_ids = self.tokenizer.encode(prompt, add_special_tokens=False)
        if not token_ids:
            token_ids = [self.tokenizer.bos_id]

        idx = torch.tensor([token_ids], dtype=torch.long, device=self.device)

        for _ in range(max_new_tokens):
            # Crop to maximum context length if needed
            idx_cond = idx if idx.size(1) <= self.model.config.context_length else idx[:, -self.model.config.context_length:]

            # Forward pass
            logits, _ = self.model(idx_cond)

            # Pluck the logits at the final position
            logits = logits[:, -1, :]  # Shape: (1, vocab_size)

            # Apply temperature
            if temperature > 0:
                logits = logits / temperature

                # Apply Top-K filtering
                if top_k is not None and top_k > 0:
                    v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                    logits[logits < v[:, [-1]]] = -float("Inf")

                # Apply Top-P (nucleus) filtering
                if top_p is not None and top_p < 1.0:
                    sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                    cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                    
                    # Remove tokens with cumulative probability above the threshold
                    sorted_indices_to_remove = cumulative_probs > top_p
                    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                    sorted_indices_to_remove[..., 0] = 0

                    indices_to_remove = sorted_indices_to_remove.scatter(1, sorted_indices, sorted_indices_to_remove)
                    logits[indices_to_remove] = -float("Inf")

                probs = F.softmax(logits, dim=-1)
                idx_next = torch.multinomial(probs, num_samples=1)
            else:
                # Greedy argmax sampling
                idx_next = torch.argmax(logits, dim=-1, keepdim=True)

            # Append sampled token to sequence
            idx = torch.cat((idx, idx_next), dim=1)

            # Check for EOS termination
            if stop_on_eos and idx_next.item() == self.tokenizer.eos_id:
                break

        # Decode output tokens back into string
        output_ids = idx[0].tolist()
        if not include_prompt:
            output_ids = output_ids[len(token_ids):]
        return self.tokenizer.decode(output_ids, skip_special_tokens=True)

    # =====================================
    # Real-Time Streaming Generation
    # =====================================

    @torch.no_grad()
    def stream_generate(
        self,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.8,
        top_k: Optional[int] = 40,
        top_p: Optional[float] = 0.9
    ) -> Generator[str, None, None]:
        """
        Streams generated text tokens one by one for interactive UI experiences.
        """
        token_ids = self.tokenizer.encode(prompt, add_special_tokens=False)
        if not token_ids:
            token_ids = [self.tokenizer.bos_id]

        idx = torch.tensor([token_ids], dtype=torch.long, device=self.device)

        for _ in range(max_new_tokens):
            idx_cond = idx if idx.size(1) <= self.model.config.context_length else idx[:, -self.model.config.context_length:]
            logits, _ = self.model(idx_cond)
            logits = logits[:, -1, :]

            if temperature > 0:
                logits = logits / temperature
                if top_k is not None and top_k > 0:
                    v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                    logits[logits < v[:, [-1]]] = -float("Inf")

                probs = F.softmax(logits, dim=-1)
                idx_next = torch.multinomial(probs, num_samples=1)
            else:
                idx_next = torch.argmax(logits, dim=-1, keepdim=True)

            token_val = idx_next.item()
            if token_val == self.tokenizer.eos_id:
                break

            idx = torch.cat((idx, idx_next), dim=1)
            yield self.tokenizer.decode([token_val], skip_special_tokens=True)
