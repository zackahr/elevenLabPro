// components/VoiceAssistant.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, MessageSquare, Bot, User, Download, Loader2, Phone, PhoneOff,
  Zap, Wifi, WifiOff, X, Settings, Volume2, VolumeX, Copy, Trash2,
  PauseCircle, PlayCircle, Heart, Star, Sparkles, Moon, Sun,
  Palette, Languages, Clock, Share2, BookOpen, Headphones,
  Activity, Gauge, Wand2, Shield, Lightbulb
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { downloadTranscript } from '@/utils/transcript'
import { Conversation } from '@11labs/client'
import { getSignedUrl } from '@/app/actions/getSignedUrl'

export default function VoiceAssistant() {
  // Existing state
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [audioLevel, setAudioLevel] = useState(0)
  const [volume, setVolume] = useState([80])
  const [isPaused, setIsPaused] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  
  // New creative state
  const [theme, setTheme] = useState('dark')
  const [voicePersonality, setVoicePersonality] = useState('friendly')
  const [showStats, setShowStats] = useState(false)
  const [conversationTime, setConversationTime] = useState(0)
  const [totalWordsSpoken, setTotalWordsSpoken] = useState(0)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [aiMood, setAiMood] = useState('neutral')
  const [backgroundAnimation, setBackgroundAnimation] = useState(true)
  const [showTips, setShowTips] = useState(false)
  const [conversationQuality, setConversationQuality] = useState(95)
  
  const scrollAreaRef = useRef(null)
  const conversationTimerRef = useRef(null)

  // Theme configurations
  const themes = {
    dark: {
      bg: 'from-slate-900 via-zinc-900 to-black',
      card: 'bg-zinc-900/60',
      accent: 'from-emerald-500 to-blue-500',
      text: 'text-white'
    },
    neon: {
      bg: 'from-purple-900 via-pink-900 to-black',
      card: 'bg-purple-900/40',
      accent: 'from-cyan-400 to-purple-500',
      text: 'text-white'
    },
    sunset: {
      bg: 'from-orange-900 via-red-900 to-black',
      card: 'bg-orange-900/40',
      accent: 'from-yellow-400 to-red-500',
      text: 'text-white'
    }
  }

  const currentTheme = themes[theme]

  // Enhanced useEffects
  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
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

  useEffect(() => {
    if (isActive && !conversationTimerRef.current) {
      conversationTimerRef.current = setInterval(() => {
        setConversationTime(prev => prev + 1)
      }, 1000)
    } else if (!isActive && conversationTimerRef.current) {
      clearInterval(conversationTimerRef.current)
      conversationTimerRef.current = null
      setConversationTime(0) // Reset timer when conversation ends
    }
    return () => {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current)
      }
    }
  }, [isActive])

  useEffect(() => {
    if (messages.length > 0) {
      const words = messages.reduce((total, msg) => total + msg.message.split(' ').length, 0)
      setTotalWordsSpoken(words)
    }
  }, [messages])

  // AI Mood detection based on conversation state
  useEffect(() => {
    if (isSpeaking) {
      setAiMood('speaking')
    } else if (isActive && !isSpeaking) {
      setAiMood('listening')
    } else if (connectionStatus === 'connecting') {
      setAiMood('thinking')
    } else {
      setAiMood('neutral')
    }
  }, [isSpeaking, isActive, connectionStatus])

  // Quick actions for common tasks
  const quickActions = [
    { icon: Clock, label: 'Schedule', action: () => console.log('Schedule') },
    { icon: BookOpen, label: 'Read Text', action: () => console.log('Read') },
    { icon: Languages, label: 'Translate', action: () => console.log('Translate') },
    { icon: Lightbulb, label: 'Ideas', action: () => console.log('Ideas') }
  ]

  // Conversation tips
  const tips = [
    "Try asking me to explain complex topics step by step",
    "I can help you brainstorm ideas for your projects",
    "Ask me to role-play different scenarios with you",
    "I can summarize long texts or documents for you"
  ]

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Add missing functions
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

  // Enhanced Listening Mode Visualization
  const ListeningVisualizer = () => (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings for listening */}
      {[1, 2, 3, 4].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-blue-400/20"
          style={{
            width: `${120 + ring * 40}px`,
            height: `${120 + ring * 40}px`,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0.1, 0.6],
            borderColor: [
              'rgba(59, 130, 246, 0.2)',
              'rgba(59, 130, 246, 0.6)',
              'rgba(59, 130, 246, 0.2)'
            ]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: ring * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Central listening indicator */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.3)',
            '0 0 40px rgba(59, 130, 246, 0.6)',
            '0 0 20px rgba(59, 130, 246, 0.3)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Headphones className="w-8 h-8 text-white" />
        </motion.div>
      </motion.div>

      {/* Sound wave particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180)
        const radius = 80
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top: `calc(50% + ${Math.sin(angle) * radius}px)`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        )
      })}
    </div>
  )

  // Enhanced Voice Orb with new Listening mode
  const VoiceOrb = () => (
    <div className="relative flex items-center justify-center">
      {/* Animated background particles */}
      {backgroundAnimation && (
        <div className="absolute inset-0 w-80 h-80">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      )}

      {/* Mood-based outer rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className={`absolute rounded-full border-2 ${
            aiMood === 'happy' ? 'border-green-400/30' :
            aiMood === 'thinking' ? 'border-yellow-400/30' :
            aiMood === 'speaking' ? 'border-red-400/30' :
            aiMood === 'listening' ? 'border-blue-400/30' :
            'border-orange-500/20'
          }`}
          style={{
            width: `${200 + ring * 60}px`,
            height: `${200 + ring * 60}px`,
          }}
          animate={aiMood === 'listening' ? {
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.1, 0.4],
          } : isSpeaking ? {
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          } : {}}
          transition={{
            duration: aiMood === 'listening' ? 1.8 : 2,
            repeat: (aiMood === 'listening' || isSpeaking) ? Infinity : 0,
            delay: ring * 0.3,
          }}
        />
      ))}

      {/* Enhanced main orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isActive ? endConversation : startConversation}
        disabled={connectionStatus === 'connecting'}
        className={`relative w-48 h-48 rounded-full cursor-pointer overflow-hidden shadow-2xl 
          ${isActive 
            ? `bg-gradient-to-br ${currentTheme.accent} shadow-orange-500/25` 
            : 'bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-zinc-800/50'
          } 
          transition-all duration-300 flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-orange-500/50
          disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white/10`}
        aria-label={isActive ? 'End conversation' : 'Start conversation'}
      >
        {/* Dynamic particle system for speaking */}
        {isSpeaking && (
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/60 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  x: [0, (Math.random() - 0.5) * 80],
                  y: [0, (Math.random() - 0.5) * 80],
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

        {/* Listening mode particle system */}
        {isActive && !isSpeaking && aiMood === 'listening' && (
          <div className="absolute inset-0">
            {/* Floating sound waves */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-1 bg-blue-400/40 rounded-full"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${15 + Math.random() * 70}%`,
                  rotate: `${Math.random() * 360}deg`
                }}
                animate={{
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20],
                  opacity: [0, 0.8, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
            
            {/* Pulse effect from center */}
            <motion.div
              className="absolute inset-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2"
              animate={{
                scale: [0, 8, 0],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-blue-400/30" />
            </motion.div>
          </div>
        )}

        {/* Mood-based center content */}
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.1, 1] } : 
                  aiMood === 'listening' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ 
            duration: isSpeaking ? 0.8 : 1.5, 
            repeat: (isSpeaking || aiMood === 'listening') ? Infinity : 0 
          }}
          className="z-10 flex flex-col items-center space-y-2"
        >
          {connectionStatus === 'connecting' ? (
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          ) : isActive ? (
            <>
              {aiMood === 'listening' ? (
                // Enhanced Listening Mode Display
                <motion.div className="flex flex-col items-center space-y-3">
                  <motion.div
                    animate={{ 
                      rotateY: [0, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity }
                    }}
                    className="relative"
                  >
                    <Headphones className="w-12 h-12 text-white" />
                    {/* Animated sound waves around headphones */}
                    <motion.div
                      className="absolute -top-2 -left-2 -right-2 -bottom-2"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.1, 0.3]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-full h-full rounded-full border-2 border-blue-400/40" />
                    </motion.div>
                  </motion.div>
                  
                  {/* Listening indicator bars */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-blue-400 rounded-full"
                        animate={{
                          height: [8, 16 + Math.random() * 12, 8],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Pulsing "Listening" text */}
                  <motion.div
                    animate={{ 
                      opacity: [0.7, 1, 0.7],
                      scale: [0.9, 1, 0.9]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-blue-300 font-medium tracking-wide"
                  >
                    ● LISTENING
                  </motion.div>
                </motion.div>
              ) : (
                // Speaking mode (existing)
                <motion.div
                  animate={{ 
                    rotate: isSpeaking ? [0, 5, -5, 0] : 0,
                    scale: aiMood === 'happy' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                >
                  <div className="relative">
                    <Mic className="w-12 h-12 text-white" />
                    {isSpeaking && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-white/50"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* Audio visualizer for speaking mode */}
              {isSpeaking && <AudioVisualizer />}
              {aiMood === 'happy' && <Heart className="w-4 h-4 text-pink-300" />}
            </>
          ) : (
            // Inactive state
            <>
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bot className="w-16 h-16 text-white/90" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-xs text-white/60 font-medium"
              >
                Click to Start
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Quality indicator ring */}
        <motion.div 
          className={`absolute inset-0 rounded-full border-4 ${
            connectionStatus === 'connected' ? 'border-emerald-400/50' :
            connectionStatus === 'connecting' ? 'border-amber-400/50' :
            'border-transparent'
          }`}
          animate={connectionStatus === 'connected' ? {
            borderColor: ['rgba(52, 211, 153, 0.5)', 'rgba(52, 211, 153, 0.8)', 'rgba(52, 211, 153, 0.5)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Floating action buttons around orb */}
      <AnimatePresence>
        {showQuickActions && isActive && (
          <div className="absolute inset-0 w-48 h-48">
            {quickActions.map((action, index) => {
              const angle = (index * 90) - 45
              const radius = 140
              const x = Math.cos(angle * Math.PI / 180) * radius
              const y = Math.sin(angle * Math.PI / 180) * radius
              
              return (
                <motion.button
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  style={{ 
                    left: `calc(50% + ${x}px - 24px)`,
                    top: `calc(50% + ${y}px - 24px)`
                  }}
                  onClick={action.action}
                  title={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </motion.button>
              )
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  )

  // Enhanced Audio Visualizer
  const AudioVisualizer = () => (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 bg-gradient-to-t ${currentTheme.accent} rounded-full`}
          animate={isSpeaking ? {
            height: [4, Math.random() * 20 + 10, 4],
            opacity: [0.5, 1, 0.5],
          } : { height: 4, opacity: 0.3 }}
          transition={{
            duration: 0.3,
            repeat: isSpeaking ? Infinity : 0,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} ${currentTheme.text} flex items-center justify-center relative overflow-hidden`}>
      
      {/* Theme and settings panel */}
      <motion.div 
        className="absolute top-6 right-6 z-50"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="text-white hover:bg-white/10 rounded-full"
            title="Stats"
          >
            <Activity className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'neon' : theme === 'neon' ? 'sunset' : 'dark')}
            className="text-white hover:bg-white/10 rounded-full"
            title="Change Theme"
          >
            <Palette className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTips(!showTips)}
            className="text-white hover:bg-white/10 rounded-full"
            title="Tips"
          >
            <Lightbulb className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Stats overlay */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-6 bg-black/80 backdrop-blur-sm rounded-2xl p-4 space-y-3 z-40"
          >
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white">Duration: {formatTime(conversationTime)}</span>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">Messages: {messageCount}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Gauge className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white">Quality: {conversationQuality}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips overlay */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-1/2 left-6 transform -translate-y-1/2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 max-w-sm z-40 border border-white/10"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Pro Tips</h3>
            </div>
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm text-white/80 flex items-start space-x-2"
                >
                  <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl mx-auto p-6">
        <div className={`grid gap-8 ${showChat ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
          
          {/* Enhanced Main Interface */}
          <div className={`${showChat ? 'lg:col-span-2' : 'col-span-1'} flex items-center justify-center`}>
            <Card className={`${currentTheme.card} backdrop-blur-sm border-white/10 rounded-3xl shadow-2xl overflow-hidden relative`}>
              
              {/* Header with AI personality indicator */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                {/* <StatusIndicator status={connectionStatus} /> */}
                <motion.div 
                  className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full"
                  animate={{ scale: aiMood === 'speaking' ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: aiMood === 'speaking' ? Infinity : 0 }}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    aiMood === 'happy' ? 'bg-green-400' :
                    aiMood === 'thinking' ? 'bg-yellow-400' :
                    aiMood === 'speaking' ? 'bg-red-400' :
                    aiMood === 'listening' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                  <span className="text-xs font-medium capitalize text-white">{aiMood}</span>
                </motion.div>
              </div>

              <CardContent className="flex flex-col items-center justify-center p-12 space-y-10 pt-20">
                
                {/* Enhanced Voice Orb */}
                <VoiceOrb />

                {/* Enhanced Controls */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Main Action Button with dynamic text */}
                  <Button
                    onClick={isActive ? endConversation : startConversation}
                    disabled={connectionStatus === 'connecting'}
                    size="lg"
                    className={`px-10 py-4 text-lg font-semibold transition-all duration-300 rounded-2xl ${
                      isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : `bg-gradient-to-r ${currentTheme.accent} hover:shadow-lg text-white shadow-lg`
                    } hover:shadow-xl transform hover:scale-105 relative overflow-hidden`}
                  >
                    {/* Button animation overlay */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <span className="relative z-10">
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
                    </span>
                  </Button>

                  {/* Enhanced Chat Toggle */}
                  <motion.div className="relative">
                    <Button
                      onClick={() => setShowChat(!showChat)}
                      variant="outline"
                      size="lg"
                      className={`px-8 py-4 text-lg bg-blue font-semibold rounded-2xl border-2 transition-all duration-300 ${
                        showChat 
                          ? 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25' 
                          : 'border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                      } transform hover:scale-105`}
                    >
                      <MessageSquare className="w-6 h-6 mr-2" />
                      Chat
                      {messageCount > 0 && (
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
                        >
                          {messageCount}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>

                  {/* Quick Actions Toggle */}
                </div>

                {/* Enhanced status messages with animations */}
                <AnimatePresence mode="wait">
                  {connectionStatus === 'connecting' && (
                    <motion.div
                      key="connecting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <p className="text-lg text-amber-400 font-medium mb-2">
                        Establishing secure connection...
                      </p>
                      <motion.div
                        className="w-32 h-1 bg-amber-400/30 rounded-full mx-auto overflow-hidden"
                      >
                        <motion.div
                          className="h-full bg-amber-400 rounded-full"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                  {isActive && isSpeaking && (
                    <motion.p
                      key="speaking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-lg text-emerald-400 font-medium flex items-center space-x-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                      <span>AI is speaking...</span>
                    </motion.p>
                  )}
                  {isActive && !isSpeaking && (
                    <motion.p
                      key="listening"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-lg text-blue-400 font-medium flex items-center space-x-3"
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          rotate: [0, 10, -10, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Headphones className="w-6 h-6" />
                      </motion.div>
                      <span>I'm listening carefully...</span>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex space-x-1"
                      >
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-1 h-1 bg-blue-400 rounded-full" />
                        ))}
                      </motion.div>
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
                <Card className={`${currentTheme.card} backdrop-blur-sm border-white/10 h-[700px] w-[500px] flex flex-col rounded-3xl shadow-2xl`}>
                  <CardHeader className="pb-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-xl text-white">Conversation</CardTitle>
                        <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          {messages.length} messages
                        </Badge>
                        {conversationTime > 0 && (
                          <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {formatTime(conversationTime)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.share?.({ 
                            title: 'Conversation Transcript',
                            text: messages.map(m => `${m.source}: ${m.message}`).join('\n')
                          })}
                          className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadTranscript(messages)}
                          disabled={messages.length === 0}
                          className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMessages([])
                            setConversationTime(0)
                          }}
                          disabled={messages.length === 0}
                          className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          title="Clear"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowChat(false)}
                          className="h-9 w-9 p-0 text-white hover:bg-white/10 rounded-xl"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                      <div className="p-6 space-y-4 pb-20">
                        {messages.length === 0 ? (
                          <motion.div 
                            className="flex flex-col items-center justify-center h-64 text-zinc-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <motion.div
                              animate={{ 
                                y: [0, -10, 0],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              <Bot className="w-16 h-16 mb-4 text-emerald-400" />
                            </motion.div>
                            <p className="text-center text-lg mb-2 text-white">Ready to chat!</p>
                            <p className="text-center text-sm text-white/60">
                              Start a conversation to see our dialogue here
                            </p>
                          </motion.div>
                        ) : (
                          <>
                            {messages.map((message, index) => (
                              <motion.div
                                key={`${index}-${message.timestamp?.getTime()}`}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                className={`flex items-start space-x-3 group ${
                                  message.source === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                }`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                                    message.source === 'user'
                                      ? `bg-gradient-to-r ${currentTheme.accent}`
                                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                                  }`}
                                >
                                  {message.source === 'user' ? (
                                    <User className="w-5 h-5 text-white" />
                                  ) : (
                                    <Bot className="w-5 h-5 text-white" />
                                  )}
                                </motion.div>
                                <div
                                  className={`max-w-[75%] p-4 rounded-2xl shadow-sm relative ${
                                    message.source === 'user'
                                      ? `bg-gradient-to-r ${currentTheme.accent} text-white`
                                      : 'bg-white/10 text-white backdrop-blur-sm border border-white/20'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed break-words">{message.message}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-xs opacity-60">
                                      {message.timestamp?.toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </p>
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded"
                                        onClick={() => {
                                          navigator.clipboard.writeText(message.message)
                                          // Optional: Add toast notification here
                                        }}
                                        title="Copy"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      {message.source === 'user' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded"
                                          title="Like"
                                        >
                                          <Heart className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                            
                            {/* Enhanced Typing indicator when AI is thinking */}
                            {isActive && !isSpeaking && connectionStatus === 'connected' && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center space-x-3"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                  <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                      {[...Array(3)].map((_, i) => (
                                        <motion.div
                                          key={i}
                                          className="w-2 h-2 bg-white/60 rounded-full"
                                          animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [0.5, 1, 0.5]
                                          }}
                                          transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.2
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-white/60 ml-2">AI is thinking...</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </>
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
