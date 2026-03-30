import torch

print("¿PyTorch detecta la tarjeta gráfica?:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Nombre de la gráfica:", torch.cuda.get_device_name(0))