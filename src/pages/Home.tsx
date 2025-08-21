
/**
 * Главная страница приложения для печати термоэтикеток
 * Содержит интерфейс сканирования QR-кодов, редактор этикеток и управление печатью
 */
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Scan, Printer, Save, Download, QrCode, Trash2, Plus, Copy, Edit, Eye } from 'lucide-react'

interface LabelField {
  id: string
  type: 'text' | 'image' | 'qr'
  content: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  qrSize?: number
}

interface LabelTemplate {
  id: string
  name: string
  fields: LabelField[]
  createdAt: Date
  updatedAt: Date
  isTemplate?: boolean
  templateCategory?: string
  labelSize?: {
    width: number
    height: number
    unit: 'mm' | 'inch'
  }
  printSettings?: {
    dpi: number
    orientation: 'portrait' | 'landscape'
    margins: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
}

export default function Home() {
  // Ключи для localStorage
  const STORAGE_KEYS = {
    LABELS: 'thermo_labels',
    TEMPLATES: 'thermo_templates',
    SETTINGS: 'thermo_settings',
    LOGO: 'thermo_logo'
  }

  // Инициализация состояний
  const [qrCode, setQrCode] = useState('')
  const [isAutoPrint, setIsAutoPrint] = useState(false)
  const [currentLabel, setCurrentLabel] = useState<LabelTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const labelPreviewRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState('create')
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [printSettings, setPrintSettings] = useState({
    labelWidth: 60, // mm
    labelHeight: 40, // mm
    dpi: 300,
    orientation: 'portrait' as 'portrait' | 'landscape',
    margins: {
      top: 2,
      right: 2,
      bottom: 2,
      left: 2
    }
  })
  const [showPrintSettings, setShowPrintSettings] = useState(false)
  const [selectedLabelsForPrint, setSelectedLabelsForPrint] = useState<string[]>([])
  const [showBatchPrintDialog, setShowBatchPrintDialog] = useState(false)

  // Предустановленные шаблоны
  const getPredefinedTemplates = (): LabelTemplate[] => {
    const baseDate = new Date()
    return [
      {
        id: 'preset-vanity',
        name: 'Тумба под раковину',
        templateCategory: 'Мебель для ванной',
        isTemplate: true,
        fields: [
          {
            id: '1',
            type: 'text',
            content: 'Тумба под раковину',
            x: 10,
            y: 10,
            width: 120,
            height: 25,
            fontSize: 14,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'text',
            content: 'Модель: [название]',
            x: 10,
            y: 40,
            width: 100,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '3',
            type: 'text',
            content: 'Размер: [размер]',
            x: 10,
            y: 65,
            width: 100,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '4',
            type: 'qr',
            content: '[артикул]',
            x: 140,
            y: 10,
            width: 60,
            height: 60,
            qrSize: 50
          }
        ],
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'preset-mirror',
        name: 'Зеркало для ванной',
        templateCategory: 'Мебель для ванной',
        isTemplate: true,
        fields: [
          {
            id: '1',
            type: 'text',
            content: 'Зеркало',
            x: 10,
            y: 10,
            width: 80,
            height: 25,
            fontSize: 14,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'text',
            content: 'С подсветкой: [да/нет]',
            x: 10,
            y: 40,
            width: 120,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '3',
            type: 'qr',
            content: '[артикул]',
            x: 100,
            y: 10,
            width: 60,
            height: 60,
            qrSize: 50
          }
        ],
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'preset-cabinet',
        name: 'Настенный шкаф',
        templateCategory: 'Мебель для ванной',
        isTemplate: true,
        fields: [
          {
            id: '1',
            type: 'text',
            content: 'Настенный шкаф',
            x: 10,
            y: 10,
            width: 100,
            height: 25,
            fontSize: 14,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'text',
            content: 'Материал: [материал]',
            x: 10,
            y: 40,
            width: 100,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '3',
            type: 'text',
            content: 'Цвет: [цвет]',
            x: 10,
            y: 65,
            width: 100,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '4',
            type: 'qr',
            content: '[артикул]',
            x: 120,
            y: 10,
            width: 60,
            height: 60,
            qrSize: 50
          }
        ],
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'preset-accessories',
        name: 'Аксессуары для ванной',
        templateCategory: 'Аксессуары',
        isTemplate: true,
        fields: [
          {
            id: '1',
            type: 'text',
            content: 'Аксессуар: [название]',
            x: 10,
            y: 10,
            width: 120,
            height: 25,
            fontSize: 14,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'text',
            content: 'Тип: [держатель/крючок/полка]',
            x: 10,
            y: 40,
            width: 120,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '3',
            type: 'qr',
            content: '[артикул]',
            x: 140,
            y: 10,
            width: 50,
            height: 50,
            qrSize: 40
          }
        ],
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'preset-faucet',
        name: 'Смеситель для ванной',
        templateCategory: 'Сантехника',
        isTemplate: true,
        fields: [
          {
            id: '1',
            type: 'text',
            content: 'Смеситель',
            x: 10,
            y: 10,
            width: 80,
            height: 25,
            fontSize: 14,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'text',
            content: 'Тип: [настенный/напольный]',
            x: 10,
            y: 40,
            width: 120,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '3',
            type: 'text',
            content: 'Цвет: [цвет]',
            x: 10,
            y: 65,
            width: 100,
            height: 20,
            fontSize: 10,
            fontFamily: 'Arial'
          },
          {
            id: '4',
            type: 'qr',
            content: '[артикул]',
            x: 140,
            y: 10,
            width: 60,
            height: 60,
            qrSize: 50
          }
        ],
        createdAt: baseDate,
        updatedAt: baseDate
      }
    ]
  }

  // Загрузка данных из localStorage при инициализации
  useEffect(() => {
    const savedLabels = localStorage.getItem(STORAGE_KEYS.LABELS)
    const savedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES)
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    const savedLogo = localStorage.getItem(STORAGE_KEYS.LOGO)
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setIsAutoPrint(settings.autoPrint || false)
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error)
      }
    }
    
    if (savedLogo) {
      setLogo(savedLogo)
    }
    
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt)
        }))
        setTemplates(parsedTemplates)
      } catch (error) {
        console.error('Ошибка загрузки шаблонов:', error)
      }
    } else {
      // Если нет сохраненных шаблонов, добавляем предустановленные
      const predefinedTemplates = getPredefinedTemplates()
      setTemplates(predefinedTemplates)
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(predefinedTemplates))
    }
  }, [])

  // Сохранение настроек при их изменении
  useEffect(() => {
    const settings = {
      autoPrint: isAutoPrint,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }, [isAutoPrint])

  // Сохранение логотипа при его изменении
  useEffect(() => {
    if (logo) {
      localStorage.setItem(STORAGE_KEYS.LOGO, logo)
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGO)
    }
  }, [logo])

  // Сохранение шаблонов при их изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates))
  }, [templates])

  // Сохранение этикеток при их изменении
  useEffect(() => {
    if (currentLabel && !currentLabel.isTemplate) {
      // Загружаем все этикетки
      const savedLabels = localStorage.getItem(STORAGE_KEYS.LABELS)
      let allLabels: LabelTemplate[] = []
      
      if (savedLabels) {
        try {
          allLabels = JSON.parse(savedLabels)
        } catch (error) {
          console.error('Ошибка загрузки этикеток:', error)
        }
      }
      
      // Обновляем или добавляем текущую этикетку
      const existingIndex = allLabels.findIndex(label => label.id === currentLabel.id)
      if (existingIndex >= 0) {
        allLabels[existingIndex] = currentLabel
      } else {
        allLabels.push(currentLabel)
      }
      
      // Сохраняем обновленный список
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(allLabels))
    }
  }, [currentLabel])

  // Начало перетаскивания поля
  const handleDragStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault()
    setSelectedField(fieldId)
    setIsDragging(true)
    
    if (!currentLabel || !labelPreviewRef.current) return
    
    const field = currentLabel.fields.find(f => f.id === fieldId)
    if (!field) return
    
    const rect = labelPreviewRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - field.x,
      y: e.clientY - rect.top - field.y
    })
  }

  // Перемещение поля
  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !currentLabel || !labelPreviewRef.current) return
    
    const rect = labelPreviewRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragOffset.x
    const newY = e.clientY - rect.top - dragOffset.y
    
    // Ограничиваем перемещение в пределах области предпросмотра
    const field = currentLabel.fields.find(f => f.id === selectedField)
    if (!field) return
    
    const maxX = rect.width - field.width
    const maxY = rect.height - field.height
    
    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))
    
    const updatedFields = currentLabel.fields.map(field => 
      field.id === selectedField 
        ? { ...field, x: clampedX, y: clampedY }
        : field
    )
    
    setCurrentLabel({
      ...currentLabel,
      fields: updatedFields,
      updatedAt: new Date()
    })
  }

  // Окончание перетаскивания
  const handleDragEnd = () => {
    setIsDragging(false)
    setSelectedField(null)
  }

  // Изменение размера поля
  const handleResize = (fieldId: string, width: number, height: number) => {
    if (!currentLabel) return
    
    const updatedFields = currentLabel.fields.map(field => 
      field.id === fieldId 
        ? { 
            ...field, 
            width: Math.max(20, width), 
            height: Math.max(20, height),
            qrSize: field.type === 'qr' ? Math.min(width, height) : field.qrSize
          }
        : field
    )
    
    setCurrentLabel({
      ...currentLabel,
      fields: updatedFields,
      updatedAt: new Date()
    })
  }

  // Добавление нового поля
  const addNewField = (type: 'text' | 'image' | 'qr') => {
    if (!currentLabel) return
    
    const newField: LabelField = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'Новый текст' : type === 'qr' ? qrCode : '',
      x: 10,
      y: 10,
      width: type === 'text' ? 100 : type === 'qr' ? 60 : 50,
      height: type === 'text' ? 30 : type === 'qr' ? 60 : 50,
      fontSize: type === 'text' ? 12 : undefined,
      fontFamily: type === 'text' ? 'Arial' : undefined,
      qrSize: type === 'qr' ? 50 : undefined
    }
    
    setCurrentLabel({
      ...currentLabel,
      fields: [...currentLabel.fields, newField],
      updatedAt: new Date()
    })
  }

  // Удаление поля
  const removeField = (fieldId: string) => {
    if (!currentLabel) return
    
    const updatedFields = currentLabel.fields.filter(field => field.id !== fieldId)
    setCurrentLabel({
      ...currentLabel,
      fields: updatedFields,
      updatedAt: new Date()
    })
  }

  // Поиск этикетки по QR-коду
  const findLabelByQrCode = (code: string): LabelTemplate | null => {
    const savedLabels = localStorage.getItem(STORAGE_KEYS.LABELS)
    if (!savedLabels) return null
    
    try {
      const allLabels: LabelTemplate[] = JSON.parse(savedLabels)
      return allLabels.find(label => 
        label.fields.some(field => 
          field.type === 'text' && field.content.includes(code)
        )
      ) || null
    } catch (error) {
      console.error('Ошибка поиска этикетки:', error)
      return null
    }
  }

  // Получение всех сохраненных этикеток
  const getAllLabels = (): LabelTemplate[] => {
    const savedLabels = localStorage.getItem(STORAGE_KEYS.LABELS)
    if (!savedLabels) return []
    
    try {
      return JSON.parse(savedLabels).map((label: any) => ({
        ...label,
        createdAt: new Date(label.createdAt),
        updatedAt: new Date(label.updatedAt)
      }))
    } catch (error) {
      console.error('Ошибка загрузки этикеток:', error)
      return []
    }
  }

  // Удаление этикетки
  const deleteLabel = (labelId: string) => {
    const savedLabels = localStorage.getItem(STORAGE_KEYS.LABELS)
    if (!savedLabels) return
    
    try {
      let allLabels: LabelTemplate[] = JSON.parse(savedLabels)
      allLabels = allLabels.filter(label => label.id !== labelId)
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(allLabels))
      
      // Если удаляем текущую этикетку, очищаем ее
      if (currentLabel && currentLabel.id === labelId) {
        setCurrentLabel(null)
      }
    } catch (error) {
      console.error('Ошибка удаления этикетки:', error)
    }
  }

  // Очистка всех данных
  const clearAllData = () => {
    if (confirm('Вы уверены, что хотите удалить все этикетки и настройки? Это действие необратимо.')) {
      localStorage.removeItem(STORAGE_KEYS.LABELS)
      localStorage.removeItem(STORAGE_KEYS.SETTINGS)
      localStorage.removeItem(STORAGE_KEYS.LOGO)
      setCurrentLabel(null)
      setLogo(null)
      setIsAutoPrint(false)
      setQrCode('')
      alert('Все данные успешно удалены')
    }
  }

  // Удаление всех этикеток
  const clearAllLabels = () => {
    if (confirm('Вы уверены, что хотите удалить все этикетки? Настройки и логотип останутся.')) {
      localStorage.removeItem(STORAGE_KEYS.LABELS)
      setCurrentLabel(null)
      setQrCode('')
      alert('Все этикетки успешно удалены')
    }
  }

  // Обработка сканирования QR-кода
  const handleQrScan = (code: string) => {
    setQrCode(code)
    
    // Ищем этикетку в localStorage
    const foundLabel = findLabelByQrCode(code)
    
    if (foundLabel) {
      // Если найдена, загружаем ее
      setCurrentLabel(foundLabel)
    } else {
      // Если не найдена, создаем новую
      const newLabel: LabelTemplate = {
        id: Date.now().toString(),
        name: `Этикетка ${code}`,
        fields: [
          {
            id: '1',
            type: 'text',
            content: `QR: ${code}`,
            x: 10,
            y: 10,
            width: 100,
            height: 30,
            fontSize: 12,
            fontFamily: 'Arial'
          },
          {
            id: '2',
            type: 'qr',
            content: code,
            x: 120,
            y: 10,
            width: 60,
            height: 60,
            qrSize: 50
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setCurrentLabel(newLabel)
    }
    
    if (isAutoPrint) {
      handlePrint()
    }
  }

  // Загрузка логотипа
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogo(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Конвертация мм в пиксели с учетом DPI
  const mmToPixels = (mm: number, dpi: number): number => {
    return Math.round((mm * dpi) / 25.4)
  }

  // Генерация CSS для печати
  const generatePrintCSS = (): string => {
    const { labelWidth, labelHeight, dpi, orientation, margins } = printSettings
    
    // Конвертируем размеры в пиксели
    const widthPx = mmToPixels(labelWidth, dpi)
    const heightPx = mmToPixels(labelHeight, dpi)
    const marginTopPx = mmToPixels(margins.top, dpi)
    const marginRightPx = mmToPixels(margins.right, dpi)
    const marginBottomPx = mmToPixels(margins.bottom, dpi)
    const marginLeftPx = mmToPixels(margins.left, dpi)
    
    return `
      @media print {
        @page {
          size: ${orientation};
          margin: 0;
        }
        
        body * {
          visibility: hidden;
        }
        
        .print-label, .print-label * {
          visibility: visible;
        }
        
        .print-label {
          position: absolute;
          left: 0;
          top: 0;
          width: ${widthPx}px;
          height: ${heightPx}px;
          margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
          background: white;
          overflow: hidden;
        }
        
        .print-field {
          position: absolute;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .print-field.text {
          font-family: Arial, sans-serif;
        }
        
        .print-field.image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .print-field.qr {
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }
      }
    `
  }

  // Создание HTML для печати одной этикетки
  const createSinglePrintHTML = (label: LabelTemplate): string => {
    const { dpi } = printSettings
    
    // Масштабируем координаты и размеры полей под реальные размеры этикетки
    const scaleX = mmToPixels(printSettings.labelWidth, dpi) / 200 // 200px - базовая ширина в редакторе
    const scaleY = mmToPixels(printSettings.labelHeight, dpi) / 256 // 256px - базовая высота в редакторе
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Печать этикетки: ${label.name}</title>
        <style>
          ${generatePrintCSS()}
        </style>
      </head>
      <body>
        <div class="print-label">
    `
    
    // Добавляем поля
    label.fields.forEach(field => {
      const x = Math.round(field.x * scaleX)
      const y = Math.round(field.y * scaleY)
      const width = Math.round(field.width * scaleX)
      const height = Math.round(field.height * scaleY)
      
      if (field.type === 'text') {
        const fontSize = field.fontSize ? Math.round(field.fontSize * Math.min(scaleX, scaleY)) : 12
        html += `
          <div class="print-field text" style="
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
            font-size: ${fontSize}px;
            font-family: ${field.fontFamily || 'Arial'};
          ">${field.content}</div>
        `
      } else if (field.type === 'image' && logo) {
        html += `
          <div class="print-field image" style="
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
          "><img src="${logo}" alt="Logo" /></div>
        `
      } else if (field.type === 'qr') {
        const qrSize = field.qrSize ? Math.round(field.qrSize * Math.min(scaleX, scaleY)) : 50
        html += `
          <div class="print-field qr" style="
            left: ${x}px;
            top: ${y}px;
            width: ${width}px;
            height: ${height}px;
          ">
            <div style="
              width: ${qrSize}px;
              height: ${qrSize}px;
              border: 2px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${Math.round(qrSize * 0.6)}px;
            ">QR</div>
          </div>
        `
      }
    })
    
    html += `
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `
    
    return html
  }

  // Печать одной этикетки
  const handlePrint = () => {
    if (!currentLabel) return
    
    try {
      const printHTML = createPrintHTML([currentLabel])
      const printWindow = window.open('', '_blank')
      
      if (printWindow) {
        printWindow.document.write(printHTML)
        printWindow.document.close()
      } else {
        // Если всплывающее окно заблокировано, используем iframe
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.write(printHTML)
          iframeDoc.close()
          
          setTimeout(() => {
            iframe.contentWindow?.print()
            setTimeout(() => {
              document.body.removeChild(iframe)
            }, 1000)
          }, 500)
        }
      }
    } catch (error) {
      console.error('Ошибка печати:', error)
      alert('Ошибка при отправке на печать. Пожалуйста, проверьте настройки принтера.')
    }
  }

  // Создание HTML для массовой печати
  const createBatchPrintHTML = (labels: LabelTemplate[]): string => {
    const { dpi, labelWidth, labelHeight, orientation, margins } = printSettings
    
    // Конвертируем размеры в пиксели
    const widthPx = mmToPixels(labelWidth, dpi)
    const heightPx = mmToPixels(labelHeight, dpi)
    const marginTopPx = mmToPixels(margins.top, dpi)
    const marginRightPx = mmToPixels(margins.right, dpi)
    const marginBottomPx = mmToPixels(margins.bottom, dpi)
    const marginLeftPx = mmToPixels(margins.left, dpi)
    
    // Масштабируем координаты и размеры полей под реальные размеры этикетки
    const scaleX = widthPx / 200 // 200px - базовая ширина в редакторе
    const scaleY = heightPx / 256 // 256px - базовая высота в редакторе
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Массовая печать этикеток</title>
        <style>
          @media print {
            @page {
              size: ${orientation};
              margin: 0;
            }
            
            body * {
              visibility: hidden;
            }
            
            .print-container, .print-container * {
              visibility: visible;
            }
            
            .print-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, ${widthPx + marginLeftPx + marginRightPx}px);
              gap: 10px;
              padding: 10px;
              page-break-inside: avoid;
            }
            
            .print-label {
              width: ${widthPx}px;
              height: ${heightPx}px;
              background: white;
              border: 1px solid #ddd;
              position: relative;
              overflow: hidden;
            }
            
            .print-field {
              position: absolute;
              white-space: nowrap;
              overflow: hidden;
            }
            
            .print-field.text {
              font-family: Arial, sans-serif;
            }
            
            .print-field.image img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            
            .print-field.qr {
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          
          .print-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, ${widthPx + marginLeftPx + marginRightPx}px);
            gap: 10px;
            padding: 10px;
          }
          
          .print-label {
            width: ${widthPx}px;
            height: ${heightPx}px;
            background: white;
            border: 1px solid #ddd;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .print-field {
            position: absolute;
            white-space: nowrap;
            overflow: hidden;
          }
          
          .print-field.text {
            font-family: Arial, sans-serif;
          }
          
          .print-field.image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          
          .print-field.qr {
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
          }
          
          .label-info {
            position: absolute;
            bottom: -25px;
            left: 0;
            right: 0;
            font-size: 10px;
            color: #666;
            text-align: center;
            background: #f5f5f5;
            padding: 2px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
    `
    
    // Добавляем все этикетки
    labels.forEach((label, index) => {
      html += `
        <div class="print-label">
          <div class="label-info">${label.name}</div>
      `
      
      // Добавляем поля для каждой этикетки
      label.fields.forEach(field => {
        const x = Math.round(field.x * scaleX)
        const y = Math.round(field.y * scaleY)
        const width = Math.round(field.width * scaleX)
        const height = Math.round(field.height * scaleY)
        
        if (field.type === 'text') {
          const fontSize = field.fontSize ? Math.round(field.fontSize * Math.min(scaleX, scaleY)) : 12
          html += `
            <div class="print-field text" style="
              left: ${x}px;
              top: ${y}px;
              width: ${width}px;
              height: ${height}px;
              font-size: ${fontSize}px;
              font-family: ${field.fontFamily || 'Arial'};
            ">${field.content}</div>
          `
        } else if (field.type === 'image' && logo) {
          html += `
            <div class="print-field image" style="
              left: ${x}px;
              top: ${y}px;
              width: ${width}px;
              height: ${height}px;
            "><img src="${logo}" alt="Logo" /></div>
          `
        } else if (field.type === 'qr') {
          const qrSize = field.qrSize ? Math.round(field.qrSize * Math.min(scaleX, scaleY)) : 50
          html += `
            <div class="print-field qr" style="
              left: ${x}px;
              top: ${y}px;
              width: ${width}px;
              height: ${height}px;
            ">
              <div style="
                width: ${qrSize}px;
                height: ${qrSize}px;
                border: 2px solid #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${Math.round(qrSize * 0.6)}px;
              ">QR</div>
            </div>
          `
        }
      })
      
      html += `
        </div>
      `
    })
    
    html += `
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            }
          }
        </script>
      </body>
      </html>
    `
    
    return html
  }

  // Обновленная функция создания HTML для печати
  const createPrintHTML = (labels: LabelTemplate[] = []): string => {
    if (labels.length === 0 && currentLabel) {
      labels = [currentLabel]
    }
    
    if (labels.length === 0) return ''
    
    if (labels.length === 1) {
      // Для одной этикетки используем старый формат
      return createSinglePrintHTML(labels[0])
    } else {
      // Для нескольких этикеток используем новый формат
      return createBatchPrintHTML(labels)
    }
  }

  // Массовая печать выбранных этикеток
  const handleBatchPrint = () => {
    if (selectedLabelsForPrint.length === 0) {
      alert('Выберите хотя бы одну этикетку для печати')
      return
    }
    
    const allLabels = getAllLabels()
    const labelsToPrint = allLabels.filter(label => selectedLabelsForPrint.includes(label.id))
    
    if (labelsToPrint.length === 0) {
      alert('Не удалось найти выбранные этикетки')
      return
    }
    
    try {
      const printHTML = createBatchPrintHTML(labelsToPrint)
      const printWindow = window.open('', '_blank')
      
      if (printWindow) {
        printWindow.document.write(printHTML)
        printWindow.document.close()
      } else {
        // Если всплывающее окно заблокировано, используем iframe
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.write(printHTML)
          iframeDoc.close()
          
          setTimeout(() => {
            iframe.contentWindow?.print()
            setTimeout(() => {
              document.body.removeChild(iframe)
            }, 1000)
          }, 500)
        }
      }
      
      setShowBatchPrintDialog(false)
      setSelectedLabelsForPrint([])
    } catch (error) {
      console.error('Ошибка массовой печати:', error)
      alert('Ошибка при отправке на печать. Пожалуйста, проверьте настройки принтера.')
    }
  }

  // Выбор/отмена выбора этикетки для массовой печати
  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabelsForPrint(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  // Выбор всех этикеток
  const selectAllLabels = () => {
    const allLabels = getAllLabels()
    setSelectedLabelsForPrint(allLabels.map(label => label.id))
  }

  // Отмена выбора всех этикеток
  const deselectAllLabels = () => {
    setSelectedLabelsForPrint([])
  }

  // Сохранение текущей этикетки в файл
  const handleSaveToFile = () => {
    if (!currentLabel) return
    const data = JSON.stringify(currentLabel, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `label_${currentLabel.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Экспорт всех этикеток в один файл
  const handleExportAll = () => {
    const allLabels = getAllLabels()
    const data = JSON.stringify({
      exported_at: new Date().toISOString(),
      total_labels: allLabels.length,
      labels: allLabels
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thermo_labels_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Импорт нескольких этикеток из файла
  const handleImportMultiple = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          
          // Проверяем формат данных (одна этикетка или несколько)
          let labelsToImport: LabelTemplate[] = []
          
          if (data.labels && Array.isArray(data.labels)) {
            // Формат экспорта всех этикеток
            labelsToImport = data.labels
          } else if (data.id && data.fields) {
            // Формат одной этикетки
            labelsToImport = [data]
          } else {
            throw new Error('Неверный формат файла')
          }
          
          // Загружаем существующие этикетки
          const existingLabels = getAllLabels()
          
          // Объединяем существующие и импортированные этикетки
          // Избегаем дубликатов по ID
          const mergedLabels = [...existingLabels]
          labelsToImport.forEach(importedLabel => {
            const existingIndex = mergedLabels.findIndex(label => label.id === importedLabel.id)
            if (existingIndex >= 0) {
              // Обновляем существующую этикетку
              mergedLabels[existingIndex] = {
                ...importedLabel,
                updatedAt: new Date()
              }
            } else {
              // Добавляем новую этикетку
              mergedLabels.push({
                ...importedLabel,
                createdAt: new Date(importedLabel.createdAt || Date.now()),
                updatedAt: new Date()
              })
            }
          })
          
          // Сохраняем объединенный список
          localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(mergedLabels))
          
          // Обновляем текущую этикетку если она была импортирована
          if (currentLabel) {
            const updatedCurrentLabel = mergedLabels.find(label => label.id === currentLabel.id)
            if (updatedCurrentLabel) {
              setCurrentLabel(updatedCurrentLabel)
            }
          }
          
          alert(`Успешно импортировано ${labelsToImport.length} этикеток`)
          
        } catch (error) {
          console.error('Ошибка импорта:', error)
          alert('Ошибка импорта файла. Проверьте формат файла.')
        }
      }
      reader.readAsText(file)
    }
    // Сбрасываем значение input для возможности повторного выбора того же файла
    event.target.value = ''
  }

  // Загрузка из файла
  const handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          setCurrentLabel(data)
        } catch (error) {
          alert('Ошибка загрузки файла')
        }
      }
      reader.readAsText(file)
    }
  }

  // Создание нового шаблона
  const createNewTemplate = () => {
    if (!currentLabel || !newTemplateName.trim()) return
    
    const newTemplate: LabelTemplate = {
      ...currentLabel,
      id: Date.now().toString(),
      name: newTemplateName,
      isTemplate: true,
      templateCategory: templateCategory || 'Общие',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    setTemplates([...templates, newTemplate])
    setNewTemplateName('')
    setTemplateCategory('')
    alert('Шаблон успешно создан')
  }

  // Применение шаблона
  const applyTemplate = (template: LabelTemplate) => {
    const newLabel: LabelTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (копия)`,
      isTemplate: false,
      templateCategory: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setCurrentLabel(newLabel)
    setActiveTab('create')
  }

  // Удаление шаблона
  const deleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return
    
    if (template.id.startsWith('preset-')) {
      alert('Предустановленные шаблоны нельзя удалить')
      return
    }
    
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId)
      setTemplates(updatedTemplates)
    }
  }

  // Копирование шаблона
  const duplicateTemplate = (template: LabelTemplate) => {
    const newTemplate: LabelTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (копия)`,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setTemplates([...templates, newTemplate])
  }

  // Редактирование шаблона
  const editTemplate = (template: LabelTemplate) => {
    setCurrentLabel(template)
    setActiveTab('create')
  }

  // Фильтрация шаблонов
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.templateCategory && template.templateCategory.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.templateCategory === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Получение уникальных категорий
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.templateCategory).filter(Boolean)))]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Система печати термоэтикеток
          </h1>
          <p className="text-gray-600">
            Фабрика мебели для ванной комнаты
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Создание этикеток</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны ({templates.length})</TabsTrigger>
            <TabsTrigger value="manage">Управление</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Панель сканирования и управления */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scan className="w-5 h-5" />
                      Сканер QR-кода
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите QR-код вручную"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                      />
                      <Button 
                        onClick={() => handleQrScan(qrCode)}
                        disabled={!qrCode}
                      >
                        Искать
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-print">Автопечать</Label>
                      <Switch
                        id="auto-print"
                        checked={isAutoPrint}
                        onCheckedChange={setIsAutoPrint}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Логотип
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Загрузить логотип
                    </Button>
                    {logo && (
                      <div className="mt-4 p-2 border rounded">
                        <img 
                          src={logo} 
                          alt="Логотип" 
                          className="max-w-full h-20 object-contain"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {currentLabel && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        Сохранить как шаблон
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Название шаблона</Label>
                        <Input
                          id="template-name"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          placeholder="Введите название шаблона"
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-category">Категория</Label>
                        <Input
                          id="template-category"
                          value={templateCategory}
                          onChange={(e) => setTemplateCategory(e.target.value)}
                          placeholder="Например: Мебель, Аксессуары"
                        />
                      </div>
                      <Button
                        onClick={createNewTemplate}
                        disabled={!newTemplateName.trim()}
                        className="w-full"
                      >
                        Сохранить шаблон
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Редактор этикетки */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Редактор этикетки
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentLabel ? (
                      <Tabs defaultValue="preview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
                          <TabsTrigger value="edit">Редактирование</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="preview" className="mt-4">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
                            <div 
                              ref={labelPreviewRef}
                              className="relative w-full h-64 bg-white"
                              onMouseMove={handleDragMove}
                              onMouseUp={handleDragEnd}
                              onMouseLeave={handleDragEnd}
                            >
                              {/* Предпросмотр этикетки */}
                              {currentLabel.fields.map((field) => (
                                <div
                                  key={field.id}
                                  className={`absolute border border-gray-200 p-1 cursor-move ${
                                    selectedField === field.id ? 'border-blue-500 bg-blue-50' : ''
                                  }`}
                                  style={{
                                    left: `${field.x}px`,
                                    top: `${field.y}px`,
                                    width: `${field.width}px`,
                                    height: `${field.height}px`,
                                  }}
                                  onMouseDown={(e) => handleDragStart(e, field.id)}
                                >
                                  {field.type === 'text' && (
                                    <span 
                                      className="text-sm"
                                      style={{ 
                                        fontSize: `${field.fontSize || 12}px`,
                                        fontFamily: field.fontFamily || 'Arial'
                                      }}
                                    >
                                      {field.content}
                                    </span>
                                  )}
                                  {field.type === 'image' && logo && (
                                    <img 
                                      src={logo} 
                                      alt="Логотип" 
                                      className="w-full h-full object-contain"
                                    />
                                  )}
                                  {field.type === 'qr' && (
                                    <div className="w-full h-full flex items-center justify-center bg-white">
                                      <div 
                                        className="border-2 border-gray-800"
                                        style={{ 
                                          width: `${field.qrSize || 50}px`,
                                          height: `${field.qrSize || 50}px`
                                        }}
                                      >
                                        <QrCode className="w-full h-full text-gray-800 p-1" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="edit" className="mt-4">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="label-name">Название этикетки</Label>
                              <Input
                                id="label-name"
                                value={currentLabel.name}
                                onChange={(e) => setCurrentLabel({
                                  ...currentLabel,
                                  name: e.target.value,
                                  updatedAt: new Date()
                                })}
                              />
                            </div>
                            
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2">Поля этикетки</h4>
                              <div className="space-y-2">
                                {currentLabel.fields.map((field, index) => (
                                  <div key={field.id} className="flex items-start gap-2 p-3 border rounded">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2">
                                        {field.type === 'text' && <span className="text-xs">📝</span>}
                                        {field.type === 'image' && <span className="text-xs">🖼️</span>}
                                        {field.type === 'qr' && <QrCode className="w-4 h-4" />}
                                        <span className="text-sm font-medium">Поле {index + 1}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeField(field.id)}
                                          className="ml-auto p-1 h-6 w-6"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      
                                      <Input
                                        value={field.content}
                                        onChange={(e) => {
                                          const newFields = [...currentLabel.fields]
                                          newFields[index] = { ...field, content: e.target.value }
                                          setCurrentLabel({
                                            ...currentLabel,
                                            fields: newFields,
                                            updatedAt: new Date()
                                          })
                                        }}
                                        placeholder={
                                          field.type === 'text' ? 'Текст' : 
                                          field.type === 'qr' ? 'Содержимое QR-кода' : 
                                          'Описание изображения'
                                        }
                                        className="flex-1"
                                      />
                                      
                                      {field.type === 'text' && (
                                        <div className="flex gap-2">
                                          <Input
                                            type="number"
                                            value={field.fontSize || 12}
                                            onChange={(e) => {
                                              const newFields = [...currentLabel.fields]
                                              newFields[index] = { 
                                                ...field, 
                                                fontSize: parseInt(e.target.value) || 12 
                                              }
                                              setCurrentLabel({
                                                ...currentLabel,
                                                fields: newFields,
                                                updatedAt: new Date()
                                              })
                                            }}
                                            placeholder="Размер шрифта"
                                            className="w-24"
                                          />
                                        </div>
                                      )}
                                      
                                      {field.type === 'qr' && (
                                        <div className="flex gap-2">
                                          <Input
                                            type="number"
                                            value={field.qrSize || 50}
                                            onChange={(e) => {
                                              const newFields = [...currentLabel.fields]
                                              newFields[index] = { 
                                                ...field, 
                                                qrSize: parseInt(e.target.value) || 50 
                                              }
                                              setCurrentLabel({
                                                ...currentLabel,
                                                fields: newFields,
                                                updatedAt: new Date()
                                              })
                                            }}
                                            placeholder="Размер QR"
                                            className="w-24"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addNewField('text')}
                                    className="bg-transparent"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Текст
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addNewField('qr')}
                                    className="bg-transparent"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    QR
                                  </Button>
                                  {logo && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addNewField('image')}
                                      className="bg-transparent"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Логотип
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Scan className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Отсканируйте QR-код или выберите шаблон для начала работы</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Управление шаблонами
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Поиск и фильтрация */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Поиск шаблонов..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="w-48">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Все категории</option>
                        {categories.filter(cat => cat !== 'all').map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Список шаблонов */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{template.name}</h3>
                              {template.templateCategory && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {template.templateCategory}
                                </span>
                              )}
                              {template.id.startsWith('preset-') && (
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-1">
                                  Предустановленный
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => applyTemplate(template)}
                                className="p-1 h-8 w-8"
                                title="Применить шаблон"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editTemplate(template)}
                                className="p-1 h-8 w-8"
                                title="Редактировать"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateTemplate(template)}
                                className="p-1 h-8 w-8"
                                title="Дублировать"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              {!template.id.startsWith('preset-') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteTemplate(template.id)}
                                  className="p-1 h-8 w-8 text-red-600 hover:text-red-800"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <div>Полей: {template.fields.length}</div>
                            <div>Создан: {template.createdAt.toLocaleDateString()}</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyTemplate(template)}
                              className="flex-1 bg-transparent"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Применить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editTemplate(template)}
                              className="bg-transparent"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Save className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Шаблоны не найдены</p>
                      <p className="text-sm">Создайте этикетку и сохраните ее как шаблон</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <div className="space-y-6">
              {/* Массовая печать */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Массовая печать этикеток
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowBatchPrintDialog(true)}
                        disabled={getAllLabels().length === 0}
                        className="flex-1"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Выбрать этикетки для печати
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePrint}
                        disabled={!currentLabel}
                        className="bg-transparent"
                      >
                        Печать текущей
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Доступно этикеток: {getAllLabels().length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Диалог массовой печати */}
              {showBatchPrintDialog && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Выберите этикетки для печати</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllLabels}
                          className="bg-transparent"
                        >
                          Выбрать все
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllLabels}
                          className="bg-transparent"
                        >
                          Очистить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBatchPrintDialog(false)}
                        >
                          ✕
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {getAllLabels().map((label) => (
                        <div
                          key={label.id}
                          className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                            selectedLabelsForPrint.includes(label.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleLabelSelection(label.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLabelsForPrint.includes(label.id)}
                            onChange={() => toggleLabelSelection(label.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{label.name}</div>
                            <div className="text-sm text-gray-500">
                              {label.fields.length} полей • {label.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {label.fields.map(f => f.type).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {getAllLabels().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Save className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Нет сохраненных этикеток</p>
                        <p className="text-sm">Создайте этикетку для начала работы</p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Выбрано: {selectedLabelsForPrint.length} этикеток
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowBatchPrintDialog(false)}
                          className="bg-transparent"
                        >
                          Отмена
                        </Button>
                        <Button
                          onClick={handleBatchPrint}
                          disabled={selectedLabelsForPrint.length === 0}
                        >
                          Печать ({selectedLabelsForPrint.length})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Управление данными
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleSaveToFile}
                      disabled={!currentLabel}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Сохранить текущую
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={handleExportAll}
                      disabled={getAllLabels().length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Экспорт всех ({getAllLabels().length})
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportMultiple}
                      className="hidden"
                      id="import-file"
                    />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => document.getElementById('import-file')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Импорт из файла
                    </Button>
                    <hr className="my-2" />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-red-600 border-red-200 hover:bg-red-50"
                      onClick={clearAllLabels}
                      disabled={getAllLabels().length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить все этикетки
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-red-600 border-red-200 hover:bg-red-50"
                      onClick={clearAllData}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Очистить все данные
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Save className="w-5 h-5" />
                      Управление шаблонами
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => {
                        const data = JSON.stringify(templates, null, 2)
                        const blob = new Blob([data], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `thermo_templates_export_${new Date().toISOString().split('T')[0]}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      disabled={templates.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Экспорт шаблонов ({templates.length})
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            try {
                              const importedTemplates = JSON.parse(event.target?.result as string)
                              const parsedTemplates = importedTemplates.map((t: any) => ({
                                ...t,
                                createdAt: new Date(t.createdAt),
                                updatedAt: new Date(t.updatedAt)
                              }))
                              setTemplates([...templates, ...parsedTemplates])
                              alert(`Импортировано ${parsedTemplates.length} шаблонов`)
                            } catch (error) {
                              alert('Ошибка импорта шаблонов')
                            }
                          }
                          reader.readAsText(file)
                        }
                      }}
                      className="hidden"
                      id="import-templates"
                    />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => document.getElementById('import-templates')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Импорт шаблонов
                    </Button>
                    <hr className="my-2" />
                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Вы уверены, что хотите удалить все шаблоны? Предустановленные шаблоны останутся.')) {
                          // Сохраняем только предустановленные шаблоны
                          const predefinedTemplates = getPredefinedTemplates()
                          setTemplates(predefinedTemplates)
                          localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(predefinedTemplates))
                          alert('Все пользовательские шаблоны удалены. Предустановленные шаблоны сохранены.')
                        }
                      }}
                      disabled={templates.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить все шаблоны
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
