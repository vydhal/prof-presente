const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

// Gerar QR code e salvar como imagem
const generateQRCode = async (data, filename) => {
  try {
    const qrCodePath = path.join(process.cwd(), 'uploads', 'qrcodes', `${filename}.png`);
    
    // Criar diretório se não existir
    const qrCodeDir = path.dirname(qrCodePath);
    await fs.mkdir(qrCodeDir, { recursive: true });
    
    // Gerar QR code
    await QRCode.toFile(qrCodePath, data, {
      color: {
        dark: '#000000',  // Cor do QR code
        light: '#FFFFFF'  // Cor de fundo
      },
      width: 300,
      margin: 2,
    });
    
    return qrCodePath;
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw new Error('Falha ao gerar QR code');
  }
};

// Gerar QR code como base64
const generateQRCodeBase64 = async (data) => {
  try {
    const qrCodeBase64 = await QRCode.toDataURL(data, {
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300,
      margin: 2,
    });
    
    return qrCodeBase64;
  } catch (error) {
    console.error('Erro ao gerar QR code base64:', error);
    throw new Error('Falha ao gerar QR code');
  }
};

module.exports = {
  generateQRCode,
  generateQRCodeBase64,
};

