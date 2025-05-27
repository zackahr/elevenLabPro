// components/VoiceAssistant.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  MessageSquare,
  Bot,
  User,
  Download,
  Loader2,
  Phone,
  PhoneOff,
  Zap,
  Wifi,
  WifiOff,
  X,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MoreVertical,
  Copy,
  Trash2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { downloadTranscript } from '@/utils/transcript'
import { Conversation } from '@11labs/client'
import { getSignedUrl } from '@/app/actions/getSignedUrl'

export default function VoiceAssistant() {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [audioLevel, setAudioLevel] = useState(0)
  const [volume, setVolume] = useState([80])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const scrollAreaRef = useRef(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isSpeaking])

  useEffect(() => {
    setMessageCount(messages.length)
  }, [messages])

  const startConversation = async () => {
    try {
      setConnectionStatus('connecting')
      const { signedUrl } = await getSignedUrl()
      if (!signedUrl) {
        throw new Error('Failed to get signed URL')
      }
      const conv = await Conversation.startSession({
        signedUrl,
        onMessage: (message) => {
          setMessages((prev) => [
            ...prev,
            {
              source: message.source,
              message: message.message,
              timestamp: new Date(),
            },
          ])
        },
        onError: (error) => {
          console.error('Conversation error:', error)
          setConnectionStatus('disconnected')
        },
        onStatusChange: (status) => {
          setConnectionStatus(
            status.status === 'connected' ? 'connected' : 'disconnected'
          )
        },
        onModeChange: (mode) => {
          setIsSpeaking(mode.mode === 'speaking')
        },
      })
      setConversation(conv)
      setIsActive(true)
      setConnectionStatus('connected')
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setConnectionStatus('disconnected')
    }
  }

  const endConversation = async () => {
    if (conversation) {
      await conversation.endSession()
      setConversation(null)
      setIsSpeaking(false)
      setIsActive(false)
      setConnectionStatus('disconnected')
    }
  }

  const StatusIndicator = ({ status }) => {
    const statusConfig = {
      connected: {
        color: 'bg-emerald-400',
        icon: Wifi,
        text: 'Connected',
        pulse: true,
      },
      connecting: {
        color: 'bg-amber-400',
        icon: Loader2,
        text: 'Connecting...',
        pulse: false,
      },
      disconnected: {
        color: 'bg-red-400',
        icon: WifiOff,
        text: 'Disconnected',
        pulse: false,
      },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center space-x-3 px-6 py-3 bg-zinc-800/70 backdrop-blur-sm rounded-full border border-zinc-600"
      >
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          {config.pulse && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 w-3 h-3 rounded-full ${config.color}`}
            />
          )}
        </div>
        <Icon className={`w-5 h-5 text-white ${status === 'connecting' ? 'animate-spin' : ''}`} />
        <span className="text-sm font-medium text-white">{config.text}</span>
      </motion.div>
    )
  }

  const AudioVisualizer = () => (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-full"
          animate={isSpeaking ? {
            height: [8, 24, 8],
            opacity: [0.5, 1, 0.5],
          } : { height: 8, opacity: 0.3 }}
          transition={{
            duration: 0.5,
            repeat: isSpeaking ? Infinity : 0,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  const VoiceOrb = () => (
    <div className="relative flex items-center justify-center">
      {/* Outer ripple rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border-2 border-orange-500/20"
          style={{
            width: `${200 + ring * 60}px`,
            height: `${200 + ring * 60}px`,
          }}
          animate={isSpeaking ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          } : {}}
          transition={{
            duration: 2,
            repeat: isSpeaking ? Infinity : 0,
            delay: ring * 0.3,
          }}
        />
      ))}

      {/* Main orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isActive ? endConversation : startConversation}
        disabled={connectionStatus === 'connecting'}
        className={`relative w-48 h-48 rounded-full cursor-pointer overflow-hidden shadow-2xl 
          ${isActive 
            ? 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 shadow-orange-500/25' 
            : 'bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-zinc-800/50'
          } 
          transition-all duration-300 flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-orange-500/50
          disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isActive ? 'End conversation' : 'Start conversation'}
      >
        {/* Particle effects */}
        {isSpeaking && (
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/80 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [0, (Math.random() - 0.5) * 60],
                  y: [0, (Math.random() - 0.5) * 60],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        )}

        {/* Center icon */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
          className="z-10"
        >
          {connectionStatus === 'connecting' ? (
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          ) : isActive ? (
            <div className="flex flex-col items-center space-y-2">
              <Phone className="w-12 h-12 text-white" />
              <AudioVisualizer />
            </div>
          ) : (
            <PhoneOff className="w-16 h-16 text-white/90" />
          )}
        </motion.div>

        {/* Status ring */}
        <div className={`absolute inset-0 rounded-full border-4 ${
          connectionStatus === 'connected' ? 'border-emerald-400/50' :
          connectionStatus === 'connecting' ? 'border-amber-400/50' :
          'border-transparent'
        }`} />
      </motion.button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-white flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className={`grid gap-8 ${showChat ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
          
          {/* Main Voice Interface - Centered */}
          <div className={`${showChat ? 'lg:col-span-2' : 'col-span-1'} flex items-center justify-center`}>
            <Card className="bg-zinc-900/60 backdrop-blur-sm border-zinc-700 rounded-3xl shadow-2xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-12 space-y-10">
                
                {/* Status at top */}
                <StatusIndicator status={connectionStatus} />
                
                {/* Voice Orb */}
                <VoiceOrb />

                {/* Audio Controls */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="w-full max-w-md space-y-6"
                    >
                      {/* Volume Control */}
                      <div className="flex items-center space-x-4 px-6 py-4 bg-zinc-800/50 rounded-2xl border border-zinc-600">
                        <Volume2 className="w-5 h-5 text-emerald-400" />
                        <Slider
                          value={volume}
                          onValueChange={setVolume}
                          max={100}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm text-white font-medium w-10">{volume[0]}%</span>
                      </div>

                      {/* Audio Level */}
                      <div className="px-6 py-4 bg-zinc-800/50 rounded-2xl border border-zinc-600">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-emerald-400 font-medium">Audio Level</span>
                          <span className="text-sm text-white font-medium">{Math.round(audioLevel)}%</span>
                        </div>
                        <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-400"
                            animate={{ width: `${audioLevel}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Control Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Main Action Button */}
                  <Button
                    onClick={isActive ? endConversation : startConversation}
                    disabled={connectionStatus === 'connecting'}
                    size="lg"
                    className={`px-10 py-4 text-lg font-semibold transition-all duration-300 rounded-2xl ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg shadow-emerald-500/25'
                    } hover:shadow-xl transform hover:scale-105`}
                  >
                    {connectionStatus === 'connecting' ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Connecting...
                      </>
                    ) : isActive ? (
                      'End Conversation'
                    ) : (
                      'Start Conversation'
                    )}
                  </Button>

                  {/* Chat Toggle more width set default color to black */}
                  <motion.div className="relative">
                    <Button
                      onClick={() => setShowChat(!showChat)}
                      variant="outline"
                      size="lg"
                      className={`px-20 py-4 text-lg bg-orange-500 font-semibold rounded-2xl border-2 transition-all duration-300 ${
                        showChat 
                          ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25' 
                          : 'border-zinc-500 text-white hover:bg-zinc-700 hover:border-zinc-400'
                      } transform hover:scale-105`}
                    >
                      <MessageSquare className="w-6 h-6 mr-2" />
                      Chat
                    </Button>
                    {messageCount > 0 && !showChat && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                      >
                        {messageCount > 99 ? '99+' : messageCount}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Additional Controls when active */}
                  {isActive && (
                    <>
                      <Button
                        onClick={() => setIsPaused(!isPaused)}
                        variant="outline"
                        size="lg"
                        className="px-6 py-4 rounded-2xl border-2 border-zinc-500 text-white hover:bg-zinc-700 hover:border-zinc-400 transform hover:scale-105"
                      >
                        {isPaused ? <PlayCircle className="w-6 h-6" /> : <PauseCircle className="w-6 h-6" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        className="px-6 py-4 rounded-2xl border-2 border-zinc-500 text-white hover:bg-zinc-700 hover:border-zinc-400 transform hover:scale-105"
                        onClick={() => setVolume(volume[0] > 0 ? [0] : [80])}
                      >
                        {volume[0] > 0 ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                      </Button>
                    </>
                  )}
                </div>

                {/* Status Messages */}
                <AnimatePresence>
                  {connectionStatus === 'connecting' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-lg text-amber-400 font-medium"
                    >
                      Establishing secure connection...
                    </motion.p>
                  )}
                  {isActive && isSpeaking && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-lg text-emerald-400 font-medium"
                    >
                      AI is speaking...
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Chat Panel */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:col-span-1"
              >
                <Card className="bg-zinc-900/60 backdrop-blur-sm border-zinc-700 h-[700px] w-[500px] flex flex-col rounded-3xl shadow-2xl">
                  <CardHeader className="pb-4 border-b border-zinc-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-2xl text-white">Conversation</CardTitle>
                        <Badge variant="secondary" className="text-sm bg-emerald-500 text-white">
                          {messages.length} messages
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadTranscript(messages)}
                          disabled={messages.length === 0}
                          className="h-10 w-10 p-0 text-white hover:bg-zinc-700 hover:text-white rounded-xl"
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMessages([])}
                          disabled={messages.length === 0}
                          className="h-10 w-10 p-0 text-white hover:bg-zinc-700 hover:text-white rounded-xl"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowChat(false)}
                          className="h-10 w-10 p-0 text-white hover:bg-zinc-700 hover:text-white rounded-xl"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-6 space-y-6">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Bot className="w-16 h-16 mb-4 text-emerald-400" />
                            </motion.div>
                            <p className="text-center text-lg">Start a conversation to see messages here</p>
                          </div>
                        ) : (
                          messages.map((message, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start space-x-3 group ${
                                message.source === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                  message.source === 'user'
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                }`}
                              >
                                {message.source === 'user' ? (
                                  <User className="w-5 h-5 text-white" />
                                ) : (
                                  <Bot className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div
                                className={`max-w-[80%] p-4 rounded-2xl shadow-sm relative ${
                                  message.source === 'user'
                                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                                    : 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs opacity-70">
                                    {message.timestamp?.toLocaleTimeString()}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-zinc-600 rounded"
                                    onClick={() => navigator.clipboard.writeText(message.message)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
