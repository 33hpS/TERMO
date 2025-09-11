// src/lib/thermal-printer.ts
import { ThermalPrinterConfig } from '@/types/editor';
import { EditorField } from '@/types/editor';

export class ThermalPrinterEngine {
  constructor(private config: ThermalPrinterConfig) {}

  generatePrintCommands(fields: EditorField[]): string[] {
    const commands: string[] = [];
    
    // Инициализация принтера
    commands.push('^XA'); // Начало команды Zebra
    
    // Настройка этикетки
    commands.push(`^LH0,0`); // Начальная позиция
    commands.push(`^PW${Math.round(this.config.labelWidth * this.config.dpi / 25.4)}`); // Ширина этикетки
    
    // Обработка каждого поля
    fields.forEach((field) => {
      const x = Math.round(field.x * this.config.dpi / 25.4);
      const y = Math.round(field.y * this.config.dpi / 25.4);
      
      switch (field.type) {
        case 'text':
          commands.push(`^FO${x},${y}`);
          commands.push(`^A0N,${field.fontSize || 30},${field.fontSize || 30}`);
          commands.push(`^FD${field.content}^FS`);
          break;
          
        case 'qr':
          const qrSize = Math.round((field.width || 80) * this.config.dpi / 25.4);
          commands.push(`^FO${x},${y}`);
          commands.push(`^BQ,2,${Math.min(10, Math.max(1, Math.round(qrSize / 50)))}`);
          commands.push(`^FD${field.content}^FS`);
          break;
          
        case 'barcode':
          commands.push(`^FO${x},${y}`);
          commands.push(`^BY2`);
          commands.push(`^BC,N,Y,N,N,A`);
          commands.push(`^FD${field.content}^FS`);
          break;
      }
    });
    
    // Завершение команды
    commands.push('^XZ'); // Конец команды Zebra
    
    return commands;
  }

  async sendToPrinter(commands: string[], ipAddress?: string): Promise<boolean> {
    if (!ipAddress) {
      throw new Error('IP address is required for network printing');
    }

    try {
      const commandString = commands.join('\n');
      
      // Симуляция отправки на принтер
      // В реальном приложении здесь будет HTTP-запрос к принтеру
      const response = await fetch(`http://${ipAddress}:9100`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: commandString,
        signal: AbortSignal.timeout(10000)
      });

      return response.ok;
    } catch (error) {
      console.error('Printer communication error:', error);
      return false;
    }
  }

  generatePreview(fields: EditorField[]): string {
    // Генерация SVG превью для отображения
    const width = this.config.labelWidth;
    const height = this.config.labelHeight;
    
    let svg = `<svg width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="white" stroke="black" stroke-width="0.5"/>`;
    
    fields.forEach((field) => {
      switch (field.type) {
        case 'text':
          svg += `<text x="${field.x}" y="${field.y + (field.fontSize || 12)}" 
                    font-family="${field.fontFamily || 'Arial'}" 
                    font-size="${field.fontSize || 12}" 
                    fill="black">${field.content}</text>`;
          break;
          
        case 'qr':
          // Простая прямоугольная заглушка для QR кода
          svg += `<rect x="${field.x}" y="${field.y}" 
                    width="${field.width}" height="${field.height}" 
                    fill="none" stroke="black" stroke-width="1"/>`;
          svg += `<text x="${field.x + field.width/2}" y="${field.y + field.height/2}" 
                    text-anchor="middle" dominant-baseline="middle" 
                    font-size="10" fill="black">QR</text>`;
          break;
      }
    });
    
    svg += '</svg>';
    return svg;
  }
}