'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu

// Simple character replacements to avoid parsing issues
function normalizeText(text: string): string {
  let normalized = text
  
  // Replace smart quotes
  normalized = normalized.replace(/[\u201C\u201D]/g, '"') // Smart double quotes
  normalized = normalized.replace(/[\u2018\u2019]/g, "'") // Smart single quotes
  
  // Replace dashes
  normalized = normalized.replace(/[\u2013\u2014]/g, "-") // En dash, Em dash
  
  // Replace other special characters
  normalized = normalized.replace(/\u2026/g, "...") // Ellipsis
  normalized = normalized.replace(/\u2022/g, "*") // Bullet point
  
  return normalized
}

function containsEmoji(text: string): boolean {
  return emojiRegex.test(text)
}

function removeEmojis(text: string): string {
  return text.replace(emojiRegex, "")
}

// Simple SMS-safe character validation
function isSMSSafe(text: string): boolean {
  // Check for basic ASCII characters that are SMS-safe
  const safeSMSPattern = /^[a-zA-Z0-9\s\.,!?\-'"@#$%&*+=<>(){}[\]|\\/:;]*$/
  return safeSMSPattern.test(text)
}

export default function TextNormalizer() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    })

    socketRef.current.on('display', (normalizedText: string) => {
      setOutputText(normalizedText)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const handleTextChange = (text: string) => {
    setInputText(text)
    
    let normalizedText = text
    if (containsEmoji(text)) {
      const clean = removeEmojis(text)
      normalizedText = normalizeText(clean)
    } else {
      normalizedText = normalizeText(text)
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', text)
    } else {
      setOutputText(normalizedText)
    }
  }

  const inputIsSafe = isSMSSafe(inputText)
  const inputLength = inputText.length
  const inputHasGoodDeliverability = inputIsSafe && inputLength <= 160

  const outputIsSafe = isSMSSafe(outputText)
  const outputLength = outputText.length
  const outputHasGoodDeliverability = outputIsSafe && outputLength <= 160

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SMS Text Normalizer</h1>
          <p className="text-gray-400">
            Optimize your text for SMS deliverability with character normalization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Input</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {inputLength}/160 characters
                  </span>
                  {inputHasGoodDeliverability ? (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Strong Deliverability
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Bad Deliverability
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea
                placeholder="Type your SMS text here... Try using smart quotes or em-dashes"
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="min-h-[400px] bg-gray-900 border-gray-600 text-white placeholder:text-gray-500 resize-none text-base leading-relaxed"
              />
              <div className="mt-3 text-sm text-gray-400">
                {!inputIsSafe && inputLength > 0 && (
                  <p>Warning: Contains special characters</p>
                )}
                {inputLength > 160 && (
                  <p>Warning: Exceeds 160 character SMS limit</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Output</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {outputLength}/160 characters
                  </span>
                  {outputHasGoodDeliverability ? (
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Optimized Strong Deliverability
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Still Needs Optimization
                    </Badge>
                  )}
                </div>
              </div>
              <div className="min-h-[400px] p-4 bg-gray-900 border border-gray-600 rounded-md">
                <pre className="whitespace-pre-wrap font-mono text-base leading-relaxed text-green-400">
                  {outputText || 'Normalized text will appear here...'}
                </pre>
              </div>
              <div className="mt-3 text-sm text-gray-400">
                {outputText && (
                  <>
                    {!outputIsSafe && (
                      <p>Warning: Still contains special characters</p>
                    )}
                    {outputLength > 160 && (
                      <p>Warning: Still exceeds 160 character limit</p>
                    )}
                    {outputHasGoodDeliverability && (
                      <p>Success: Ready for optimal SMS delivery</p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span>SMS-safe characters and under 160 chars</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span>Contains special chars or exceeds 160 chars</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
