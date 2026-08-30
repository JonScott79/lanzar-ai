"""
    trainer.py

    Training loop and optimization engine for LANZAR AI.

    Responsibilities:
    - Execute training epochs/steps with AdamW optimizer and gradient clipping
    - Track and log loss metrics, learning rate, and step throughput
    - Manage periodic evaluation and automated checkpointing
"""

import time
import torch
import torch.nn as nn
from typing import Optional, Callable, Dict, Any, List
from torch.utils.data import DataLoader
from ..config import LanzarModelConfig
from ..model.transformer import LanzarGPT
from .checkpoint import CheckpointManager


# =====================================
# Trainer Class
# =====================================

class LanzarTrainer:
    """
    Standard training coordinator for LANZAR GPT models.
    """

    def __init__(
        self,
        model: LanzarGPT,
        config: LanzarModelConfig,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        checkpoint_dir: str = "checkpoints"
    ):
        self.model = model
        self.config = config
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.checkpoint_dir = checkpoint_dir

        self.device = config.device
        self.model.to(self.device)

        # Configure AdamW optimizer with weight decay
        self.optimizer = torch.optim.AdamW(
            self.model.parameters(),
            lr=config.learning_rate,
            weight_decay=config.weight_decay,
            betas=(0.9, 0.95)
        )

        self.history: List[Dict[str, Any]] = []

    # =====================================
    # Training Execution
    # =====================================

    def train(
        self,
        max_steps: int = 500,
        eval_interval: int = 50,
        checkpoint_interval: int = 250,
        log_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Executes the main training loop.
        """
        self.model.train()
        step = 0
        running_loss = 0.0
        start_time = time.time()

        train_iter = iter(self.train_loader)

        while step < max_steps:
            step += 1

            # Fetch next batch
            try:
                x, y = next(train_iter)
            except StopIteration:
                train_iter = iter(self.train_loader)
                x, y = next(train_iter)

            x = x.to(self.device)
            y = y.to(self.device)

            # Forward pass
            logits, loss = self.model(x, y)

            # Backward pass & optimization
            self.optimizer.zero_grad(set_to_none=True)
            loss.backward()

            # Gradient clipping to prevent exploding gradients
            grad_norm = nn.utils.clip_grad_norm_(self.model.parameters(), self.config.grad_clip)

            self.optimizer.step()

            running_loss += loss.item()

            # Periodic Evaluation & Logging
            if step % eval_interval == 0 or step == max_steps:
                avg_train_loss = running_loss / eval_interval if step % eval_interval == 0 else running_loss / (step % eval_interval or 1)
                running_loss = 0.0

                val_loss = self.evaluate() if self.val_loader else None
                elapsed = time.time() - start_time

                metrics = {
                    "step": step,
                    "train_loss": avg_train_loss,
                    "val_loss": val_loss,
                    "grad_norm": float(grad_norm),
                    "elapsed_sec": round(elapsed, 2),
                    "device": self.device
                }
                self.history.append(metrics)

                if log_callback:
                    log_callback(metrics)
                else:
                    v_str = f" | Val Loss: {val_loss:.4f}" if val_loss is not None else ""
                    print(f"Step {step:4d}/{max_steps} | Train Loss: {avg_train_loss:.4f}{v_str} | Time: {elapsed:.1f}s")

            # Periodic Checkpoint
            if step % checkpoint_interval == 0 or step == max_steps:
                ckpt_path = f"{self.checkpoint_dir}/{self.config.model_name}_step_{step}.pt"
                CheckpointManager.save(
                    model=self.model,
                    optimizer=self.optimizer,
                    config=self.config,
                    step=step,
                    loss=loss.item(),
                    filepath=ckpt_path
                )

        total_time = time.time() - start_time
        return {
            "total_steps": step,
            "final_loss": loss.item(),
            "total_time_sec": total_time,
            "history": self.history
        }

    # =====================================
    # Evaluation
    # =====================================

    def evaluate(self, num_batches: int = 5) -> float:
        """
        Calculates loss over validation dataset.
        """
        if not self.val_loader:
            return 0.0

        self.model.eval()
        total_loss = 0.0
        batches = 0

        with torch.no_grad():
            for i, (x, y) in enumerate(self.val_loader):
                if i >= num_batches:
                    break
                x = x.to(self.device)
                y = y.to(self.device)
                _, loss = self.model(x, y)
                total_loss += loss.item()
                batches += 1

        self.model.train()
        return total_loss / max(1, batches)
