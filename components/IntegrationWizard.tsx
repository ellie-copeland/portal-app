'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, ExternalLink, Loader2, X } from 'lucide-react'
import { getIntegrationConfig, IntegrationConfig, WizardStep } from '@/lib/integration-configs'
import { authHeaders } from '@/lib/fetch-auth'

interface IntegrationWizardProps {
  integrationId: string
  onClose: () => void
  onConnected: (credentials: Record<string, any>) => void
}

export default function IntegrationWizard({
  integrationId,
  onClose,
  onConnected,
}: IntegrationWizardProps) {
  const config = getIntegrationConfig(integrationId)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  if (!config) {
    return null
  }

  const step = config.steps[currentStep]
  const isLastStep = currentStep === config.steps.length - 1
  const isFirstStep = currentStep === 0

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }))
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    step.fields.forEach(field => {
      const value = formData[field.name]

      if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[field.name] = `${field.label} is required`
      }

      if (value && field.validation) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateStep()) {
      return
    }

    if (isLastStep) {
      await handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus('testing')

    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          provider: integrationId,
          credentials: formData,
        }),
      })

      if (response.ok) {
        setConnectionStatus('success')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Test failed:', error)
      setConnectionStatus('error')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          provider: integrationId,
          config: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save integration')
      }

      onConnected(formData)
      onClose()
    } catch (error) {
      console.error('Submit failed:', error)
      setErrors({ submit: 'Failed to save integration. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{config.name}</h2>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {config.steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-muted/50 flex gap-1">
          {config.steps.map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-1 rounded-full transition-colors ${
                idx < currentStep ? 'bg-purple-500' : idx === currentStep ? 'bg-purple-500' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            {step.fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={field.name === 'webhook_url'}
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.name] || ''}
                    onChange={e => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'multi-select' && (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData[field.name] || []).includes(opt.value)}
                          onChange={e => {
                            const current = (formData[field.name] || []) as string[]
                            if (e.target.checked) {
                              handleFieldChange(field.name, [...current, opt.value])
                            } else {
                              handleFieldChange(field.name, current.filter((v: string) => v !== opt.value))
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (
                  <div className="space-y-2">
                    {field.options?.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData[field.name] || []).includes(opt.value)}
                          onChange={e => {
                            const current = (formData[field.name] || []) as string[]
                            if (e.target.checked) {
                              handleFieldChange(field.name, [...current, opt.value])
                            } else {
                              handleFieldChange(field.name, current.filter((v: string) => v !== opt.value))
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-foreground">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name]}</p>
                )}
              </div>
            ))}
          </div>

          {/* Help Text & Links */}
          {step.help && (
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">{step.help}</p>
            </div>
          )}

          {step.links && step.links.length > 0 && (
            <div className="mb-6 p-3 bg-muted/50 rounded-lg space-y-2">
              {step.links.map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Connection Status */}
          {connectionStatus !== 'idle' && (
            <div
              className={`mb-6 p-3 rounded-lg flex gap-2 items-center ${
                connectionStatus === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : connectionStatus === 'testing'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              {connectionStatus === 'success' && (
                <>
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">Connection successful!</p>
                </>
              )}
              {connectionStatus === 'testing' && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-400">Testing connection...</p>
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">Connection test failed</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/50 px-6 py-4 flex justify-between items-center sticky bottom-0">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {!isLastStep && (
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || Object.keys(errors).length > 0}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testingConnection && <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />}
                Test Connection
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLastStep ? 'Connect' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
