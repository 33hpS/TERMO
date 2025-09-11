/**
 * Главная страница приложения для печати термоэтикеток
 * Обновленная версия с новыми функциями
 */
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, Scan, Printer, Save, Download, QrCode, Trash2, Plus, Copy, Edit, Eye,
  Wifi, WifiOff, Clock, CheckCircle2, AlertTriangle, Camera, Zap, BarChart3,
  Minus, RefreshCw, Type, Grid3X3, Palette, Settings
} from 'lucide-react'

// Существующие интерфейсы
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

// Новые интерфейсы
interface PrintJob {
  id: string
  labelId: string
  labelName: string
  copies: number
  status: 'pending' | 'printing' | 'completed' | 'error'
  createdAt: Date
  estimatedTime?: number
}

interface AppStatistics {
  printedToday: number
  printedTotal: number
  templatesCount: number
  errorsCount: number
  queueSize: number
  dailyStats: number[]
}

interface PrinterStatus {
  connected: boolean
  ready: boolean
  error?: string
  paperLevel: number
  temperature: number
}

export default function Home() {
  // Ключи для localStorage
  const STORAGE_KEYS = {
    LABELS: 'thermo_labels',
    TEMPLATES: 'thermo_templates',
    SETTINGS: 'thermo_settings',
    LOGO: 'thermo_logo'
  }

  // Существующие состояния
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
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Новые состояния
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    connected: true,
    ready: true,
    paperLevel: 85,
    temperature: 180
  })
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([])
  const [statistics, setStatistics] = useState<AppStatistics>({
    printedToday: 47,
    printedTotal: 847,
    templatesCount: 12,
    errorsCount: 2,
    queueSize: 0,
    dailyStats: [40, 65, 55, 80, 47, 35, 60]
  })
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [previewMode, setPreviewMode] = useState<'normal' | 'print' | 'thermal'>('normal')
  const [copiesCount, setCopiesCount] = useState(1)
  const [activeMainTab, setActiveMainTab] = useState('quick-print')

  // Существующие состояния печати
  const [printSettings, setPrintSettings] = useState({
    labelWidth: 60,
    labelHeight: 40,
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

  // useEffect hooks
  useEffect(() => {
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
      const predefinedTemplates = getPredefinedTemplates()
      setTemplates(predefinedTemplates)
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(predefinedTemplates))
    }
  }, [])

  // Мониторинг подключения
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Сохранение темы
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString())
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Обновление статистики очереди
  useEffect(() => {
    setStatistics(prev => ({
      ...prev,
      queueSize: printQueue.length,
      templatesCount: templates.length
    }))
  }, [printQueue, templates])

  // Сохранение настроек при их изменении
  useEffect(() => {
    const settings = {
      autoPrint: isAutoPrint,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }, [isAutoPrint])

  // Новые функции управления очередью
  const addToQueue = (label: LabelTemplate, copies: number = 1) => {
    const newJob: PrintJob = {
      id: Date.now().toString(),
      labelId: label.id,
      labelName: label.name,
      copies,
      status: 'pending',
      createdAt: new Date(),
      estimatedTime: copies * 3
    }
    
    setPrintQueue(prev => [...prev, newJob])
    
    if (isAutoPrint && printerStatus.ready) {
      processQueue()
    }
  }

  const processQueue = async () => {
    const pendingJob = printQueue.find(job => job.status === 'pending')
    if (!pendingJob || !printerStatus.ready) return

    setPrintQueue(prev => prev.map(job => 
      job.id === pendingJob.id 
        ? { ...job, status: 'printing' as const }
        : job
    ))

    try {
      await simulatePrinting(pendingJob)
      
      setPrintQueue(prev => prev.map(job => 
        job.id === pendingJob.id 
          ? { ...job, status: 'completed' as const }
          : job
      ))

      setStatistics(prev => ({
        ...prev,
        printedToday: prev.printedToday + pendingJob.copies,
        printedTotal: prev.printedTotal + pendingJob.copies
      }))

      setTimeout(() => {
        setPrintQueue(prev => prev.filter(job => job.id !== pendingJob.id))
      }, 3000)

    } catch (error) {
      console.error('Ошибка печати:', error)
      setPrintQueue(prev => prev.map(job => 
        job.id === pendingJob.id 
          ? { ...job, status: 'error' as const }
          : job
      ))
      
      setStatistics(prev => ({
        ...prev,
        errorsCount: prev.errorsCount + 1
      }))
    }
  }

  const simulatePrinting = (job: PrintJob): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!printerStatus.connected) {
        reject(new Error('Принтер не подключен'))
        return
      }

      const printTime = job.copies * 2000
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve()
        } else {
          reject(new Error('Замятие бумаги'))
        }
      }, printTime)
    })
  }

  const removeFromQueue = (jobId: string) => {
    setPrintQueue(prev => prev.filter(job => job.id !== jobId))
  }

  const quickPrint = () => {
    if (!currentLabel) return
    addToQueue(currentLabel, copiesCount)
  }

  const createLabelFromQR = (code: string) => {
    const newLabel: LabelTemplate = {
      id: Date.now().toString(),
      name: `Этикетка ${code}`,
      fields: [
        {
          id: '1',
          type: 'text',
          content: code,
          x: 10,
          y: 10,
          width: 120,
          height: 25,
          fontSize: 14,
          fontFamily: 'Arial'
        },
        {
          id: '2',
          type: 'qr',
          content: code,
          x: 140,
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
    
    if (isAutoPrint) {
      addToQueue(newLabel, copiesCount)
    }
  }

  const getQueueStatus = () => {
    const printing = printQueue.filter(job => job.status === 'printing').length
    const pending = printQueue.filter(job => job.status === 'pending').length
    
    if (printing > 0) return 'printing'
    if (pending > 0) return 'pending'
    return 'empty'
  }

  // Существующие функции (сокращенные для краткости)
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

  const removeField = (fieldId: string) => {
    if (!currentLabel) return
    
    const updatedFields = currentLabel.fields.filter(field => field.id !== fieldId)
    setCurrentLabel({
      ...currentLabel,
      fields: updatedFields,
      updatedAt: new Date()
    })
  }

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
    setActiveMainTab('designer')
  }

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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.templateCategory && template.templateCategory.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.templateCategory === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.templateCategory).filter(Boolean)))]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* НОВЫЙ СТАТУС-БАР */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              ТермоЭтикетки Pro
            </h1>
            
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? (
                <><Wifi className="w-3 h-3 mr-1" /> Онлайн</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" /> Оффлайн</>
              )}
            </Badge>
            
            <Badge variant={printerStatus.ready ? "default" : "secondary"}>
              <Printer className="w-3 h-3 mr-1" />
              {printerStatus.ready ? 'Готов' : 'Занят'}
            </Badge>

            {printQueue.length > 0 && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Очередь: {printQueue.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <BarChart3 className="w-4 h-4" />
              <span>Сегодня: {statistics.printedToday}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2"
            >
              {darkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="quick-print">Быстрая печать</TabsTrigger>
            <TabsTrigger value="designer">Дизайнер</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны ({templates.length})</TabsTrigger>
            <TabsTrigger value="queue">
              Очередь ({printQueue.length})
              {getQueueStatus() === 'printing' && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          {/* НОВАЯ ВКЛАДКА: БЫСТРАЯ ПЕЧАТЬ */}
          <TabsContent value="quick-print" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    QR/Barcode Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-4 border-2 border-red-500 rounded-lg opacity-70"></div>
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Наведите на QR-код
                      </p>
                    </div>
                    <div 
                      className="absolute inset-x-4 h-0.5 bg-red-500 animate-pulse"
                      style={{
                        top: '50%',
                        animation: 'scanLine 2s ease-in-out infinite alternate'
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Или введите код вручную..." 
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => createLabelFromQR(qrCode)}
                      disabled={!qrCode}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      Создать
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Автопечать после сканирования</Label>
                    <Switch 
                      checked={isAutoPrint}
                      onCheckedChange={setIsAutoPrint}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Быстрые действия
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={() => {
                      const newLabel: LabelTemplate = {
                        id: Date.now().toString(),
                        name: 'Новая этикетка',
                        fields: [],
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }
                      setCurrentLabel(newLabel)
                      setActiveMainTab('designer')
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Создать новую этикетку
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={() => {
                      if (currentLabel) {
                        const duplicate = {
                          ...currentLabel,
                          id: Date.now().toString(),
                          name: `${currentLabel.name} (копия)`,
                          createdAt: new Date(),
                          updatedAt: new Date()
                        }
                        setCurrentLabel(duplicate)
                      }
                    }}
                    disabled={!currentLabel}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Дублировать последнюю
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    size="lg"
                    onClick={() => {
                      if (currentLabel) {
                        for (let i = 1; i <= 10; i++) {
                          addToQueue({
                            ...currentLabel,
                            id: `${currentLabel.id}_${i}`,
                            name: `${currentLabel.name} #${i}`
                          }, 1)
                        }
                      }
                    }}
                    disabled={!currentLabel}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Печать серии (1-10)
                  </Button>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm">Количество копий</Label>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCopiesCount(Math.max(1, copiesCount - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {copiesCount}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCopiesCount(Math.min(100, copiesCount + 1))}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={quickPrint}
                      disabled={!currentLabel || !printerStatus.ready}
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Быстрая печать ({copiesCount} шт.)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* УЛУЧШЕННЫЙ ПРЕДПРОСМОТР */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Предпросмотр этикетки
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant={previewMode === 'normal' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setPreviewMode('normal')}
                    >
                      Обычный
                    </Button>
                    <Button 
                      variant={previewMode === 'print' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setPreviewMode('print')}
                    >
                      Печать
                    </Button>
                    <Button 
                      variant={previewMode === 'thermal' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setPreviewMode('thermal')}
                    >
                      Термо
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-white dark:bg-gray-800">
                  {currentLabel ? (
                    <div className={`w-64 h-32 mx-auto border-2 relative ${
                      previewMode === 'thermal' 
                        ? 'bg-black text-white border-gray-800' 
                        : previewMode === 'print' 
                        ? 'shadow-lg border-gray-400 bg-white' 
                        : 'border-gray-200 bg-white'
                    }`}>
                      {currentLabel.fields.map((field) => (
                        <div
                          key={field.id}
                          className="absolute"
                          style={{
                            left: `${(field.x / 200) * 100}%`,
                            top: `${(field.y / 128) * 100}%`,
                            width: `${(field.width / 200) * 100}%`,
                            height: `${(field.height / 128) * 100}%`,
                          }}
                        >
                          {field.type === 'text' && (
                            <span 
                              className={`text-xs ${
                                previewMode === 'thermal' ? 'text-white' : 'text-gray-800'
                              }`}
                              style={{ 
                                fontSize: `${Math.max(8, (field.fontSize || 12) * 0.5)}px`,
                                fontFamily: field.fontFamily || 'Arial'
                              }}
                            >
                              {field.content}
                            </span>
                          )}
                          {field.type === 'qr' && (
                            <div className={`w-full h-full flex items-center justify-center ${
                              previewMode === 'thermal' ? 'bg-white text-black' : 'bg-white'
                            }`}>
                              <div 
                                className="border border-gray-800 flex items-center justify-center text-xs"
                                style={{ 
                                  width: `${Math.min(field.width, field.height) * 0.8}px`,
                                  height: `${Math.min(field.width, field.height) * 0.8}px`
                                }}
                              >
                                QR
                              </div>
                            </div>
                          )}
                          {field.type === 'image' && logo && (
                            <img 
                              src={logo} 
                              alt="Логотип" 
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-64 h-32 mx-auto border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <Scan className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Создайте или выберите этикетку</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 mb-2">60×32 мм • 300 DPI</p>
                    {currentLabel && (
                      <div className="flex justify-center gap-2">
                        <Button onClick={quickPrint} disabled={!printerStatus.ready}>
                          <Printer className="w-4 h-4 mr-1" />
                          В печать
                        </Button>
                        <Button variant="outline" onClick={() => setActiveMainTab('designer')}>
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* СУЩЕСТВУЮЩИЙ ТАБ ДИЗАЙНЕРА */}
          <TabsContent value="designer" className="mt-6">
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
                        onClick={() => createLabelFromQR(qrCode)}
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
                            >
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

          {/* СУЩЕСТВУЮЩИЙ ТАБ ШАБЛОНОВ */}
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
                              onClick={() => applyTemplate(template)}
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

          {/* НОВЫЙ ТАБ ОЧЕРЕДИ */}
          <TabsContent value="queue" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">В очереди</p>
                        <p className="text-xl font-bold">
                          {printQueue.filter(j => j.status === 'pending').length}
                        </p>
                      </div>
                      <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Печатается</p>
                        <p className="text-xl font-bold">
                          {printQueue.filter(j => j.status === 'printing').length}
                        </p>
                      </div>
                      <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Выполнено</p>
                        <p className="text-xl font-bold">
                          {printQueue.filter(j => j.status === 'completed').length}
                        </p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ошибки</p>
                        <p className="text-xl font-bold">
                          {printQueue.filter(j => j.status === 'error').length}
                        </p>
                      </div>
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Очередь печати
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={processQueue}
                        disabled={!printQueue.find(j => j.status === 'pending') || !printerStatus.ready}
                      >
                        Запустить печать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintQueue([])}
                        disabled={printQueue.length === 0}
                      >
                        Очистить всё
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {printQueue.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Очередь пуста</p>
                        <p className="text-sm">Добавьте этикетки для печати</p>
                      </div>
                    ) : (
                      printQueue.map((job, index) => (
                        <div 
                          key={job.id} 
                          className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                            job.status === 'printing' 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                              : job.status === 'error'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : job.status === 'completed'
                              ? 'border-gray-300 bg-gray-50 dark:bg-gray-800 opacity-70'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              job.status === 'printing' ? 'bg-green-500 animate-pulse' :
                              job.status === 'pending' ? 'bg-yellow-500' :
                              job.status === 'completed' ? 'bg-gray-500' :
                              job.status === 'error' ? 'bg-red-500' : 'bg-gray-300'
                            }`} />
                            
                            <div className="flex-1">
                              <div className="font-medium">
                                {job.labelName}
                                {job.copies > 1 && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    × {job.copies}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {job.status === 'pending' && `Позиция ${index + 1} • ${job.estimatedTime}с`}
                                {job.status === 'printing' && 'Печатается...'}
                                {job.status === 'completed' && `Выполнено • ${job.createdAt.toLocaleTimeString()}`}
                                {job.status === 'error' && 'Ошибка печати'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                job.status === 'printing' ? 'default' :
                                job.status === 'completed' ? 'secondary' :
                                job.status === 'error' ? 'destructive' :
                                'outline'
                              }
                            >
                              {job.status === 'pending' && (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  В очереди
                                </>
                              )}
                              {job.status === 'printing' && (
                                <>
                                  <div className="w-3 h-3 mr-1 bg-green-500 rounded-full animate-pulse" />
                                  Печатается
                                </>
                              )}
                              {job.status === 'completed' && (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Готово
                                </>
                              )}
                              {job.status === 'error' && (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Ошибка
                                </>
                              )}
                            </Badge>
                            
                            {(job.status === 'pending' || job.status === 'error') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromQueue(job.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {printQueue.some(job => job.status === 'printing') && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Печать в процессе...
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-300">
                          Температура: {printerStatus.temperature}°C
                        </span>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full animate-pulse" 
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          printerStatus.connected && printerStatus.ready 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">
                          Zebra ZD420 Thermal Printer
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>Бумага: {printerStatus.paperLevel}%</span>
                        <span>Темп: {printerStatus.temperature}°C</span>
                        <Button variant="outline" size="sm">
                          <Settings className="w-3 h-3 mr-1" />
                          Настройки
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* НОВЫЙ ТАБ АНАЛИТИКИ */}
          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Напечатано сегодня</p>
                        <p className="text-3xl font-bold text-blue-600">{statistics.printedToday}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          +12% к вчера
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Printer className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Всего напечатано</p>
                        <p className="text-3xl font-bold text-green-600">{statistics.printedTotal}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          За всё время
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Активных шаблонов</p>
                        <p className="text-3xl font-bold text-purple-600">{statistics.templatesCount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          +2 новых
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Save className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ошибок печати</p>
                        <p className="text-3xl font-bold text-red-600">{statistics.errorsCount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {statistics.errorsCount < 5 ? 'Отлично!' : 'Требует внимания'}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Статистика за неделю
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between gap-2 p-4">
                      {statistics.dailyStats.map((count, index) => {
                        const maxHeight = Math.max(...statistics.dailyStats)
                        const height = (count / maxHeight) * 100
                        const isToday = index === statistics.dailyStats.length - 1
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">
                              {count}
                            </div>
                            <div 
                              className={`w-full rounded-t transition-all hover:opacity-80 cursor-pointer ${
                                isToday 
                                  ? 'bg-blue-500 shadow-lg' 
                                  : 'bg-gray-400 dark:bg-gray-600'
                              }`}
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${count} этикеток`}
                            />
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
                              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Среднее за день: {Math.round(statistics.dailyStats.reduce((a, b) => a + b, 0) / 7)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Лучший день: {Math.max(...statistics.dailyStats)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Популярные шаблоны
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: 'Тумба под раковину', count: 127, percentage: 45 },
                        { name: 'Зеркало для ванной', count: 89, percentage: 32 },
                        { name: 'Настенный шкаф', count: 67, percentage: 23 },
                        { name: 'Смеситель', count: 34, percentage: 12 },
                        { name: 'Аксессуары', count: 23, percentage: 8 }
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {item.count} шт.
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Рекомендация:</strong> Тумбы под раковину печатаются чаще всего. 
                        Рассмотрите создание экспресс-шаблона для них.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Время печати</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Среднее время</span>
                        <span className="font-medium">2.3 сек</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Самая быстрая</span>
                        <span className="font-medium">1.8 сек</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Самая медленная</span>
                        <span className="font-medium">4.1 сек</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Общее время сегодня</span>
                        <span className="font-medium">1ч 48м</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Использование материалов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Этикеток осталось</span>
                        <span className="font-medium">~840 шт</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Израсходовано сегодня</span>
                        <span className="font-medium">{statistics.printedToday} шт</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">До замены рулона</span>
                        <span className="font-medium">~18 дней</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Качество печати</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Успешных печатей</span>
                        <span className="font-medium text-green-600">
                          {Math.round(((statistics.printedTotal - statistics.errorsCount) / statistics.printedTotal) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Ошибок за день</span>
                        <span className="font-medium text-red-600">{statistics.errorsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Последняя калибровка</span>
                        <span className="font-medium">3 дня назад</span>
                      </div>
                      {statistics.errorsCount > 5 && (
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-800 dark:text-red-200">
                          ⚠️ Высокий процент ошибок. Проверьте принтер.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Экспорт отчетов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Отчет за день (PDF)
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Статистика за неделю (Excel)
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Данные по шаблонам (CSV)
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Полный отчет (ZIP)
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                    Отчеты включают данные о печати, использовании материалов, ошибках и популярных шаблонах.
                    Данные обновляются в реальном времени.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0% { top: 15%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 85%; opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}