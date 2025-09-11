// src/hooks/useThermalPrinter.ts
import { useState, useCallback } from 'react';
import { ThermalPrinterConfig, PrintJob } from '@/types/editor';
import { ThermalPrinterEngine } from '@/lib/thermal-printer';

export function useThermalPrinter() {
  const [printerConfig, setPrinterConfig] = useState<ThermalPrinterConfig>({
    type: 'zebra',
    connectionType: 'network',
    dpi: 203,
    labelWidth: 100,
    labelHeight: 150,
    speed: 6,
    darkness: 10,
    orientation: 'portrait'
  });

  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Создание задания печати
  const createPrintJob = useCallback(async (labelId: string, fields: any[]) => {
    const job: PrintJob = {
      id: Date.now().toString(),
      labelId,
      printerConfig,
      status: 'pending',
      createdAt: new Date()
    };

    setPrintJobs(prev => [...prev, job]);

    try {
      const printer = new ThermalPrinterEngine(printerConfig);
      const commands = printer.generatePrintCommands(fields);
      
      // Обновляем статус
      setPrintJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, status: 'printing' } : j
      ));

      // Отправляем на печать
      const success = await printer.sendToPrinter(commands, printerConfig.ipAddress);
      
      setPrintJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: success ? 'completed' : 'failed',
          completedAt: new Date(),
          errorMessage: success ? undefined : 'Ошибка печати'
        } : j
      ));

      return success;
    } catch (error) {
      setPrintJobs(prev => prev.map(j => 
        j.id === job.id ? { 
          ...j, 
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Неизвестная ошибка'
        } : j
      ));
      return false;
    }
  }, [printerConfig]);

  // Тестирование подключения
  const testConnection = useCallback(async () => {
    try {
      if (printerConfig.connectionType === 'network' && printerConfig.ipAddress) {
        const response = await fetch(`http://${printerConfig.ipAddress}:9100`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        });
        setIsConnected(response.ok);
        return response.ok;
      }
      return false;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  }, [printerConfig]);

  // Генерация предпросмотра
  const generatePreview = useCallback((fields: any[]) => {
    const printer = new ThermalPrinterEngine(printerConfig);
    return printer.generatePreview(fields);
  }, [printerConfig]);

  return {
    printerConfig,
    setPrinterConfig,
    printJobs,
    isConnected,
    createPrintJob,
    testConnection,
    generatePreview
  };
}