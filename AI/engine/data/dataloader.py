"""
    dataloader.py

    DataLoader factory and batch utilities for LANZAR AI.

    Responsibilities:
    - Instantiate PyTorch DataLoaders with shuffle and batching
    - Provide rapid tensor batch extraction for training and validation
"""

import torch
from torch.utils.data import DataLoader
from .dataset import TextDataset


# =====================================
# DataLoader Factory
# =====================================

def create_dataloader(
    dataset: TextDataset,
    batch_size: int,
    shuffle: bool = True,
    drop_last: bool = False
) -> DataLoader:
    """
    Creates a standard PyTorch DataLoader for training/validation datasets.
    """
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        drop_last=drop_last
    )
