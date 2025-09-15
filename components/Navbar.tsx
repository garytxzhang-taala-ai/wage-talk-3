'use client'

import { useState } from 'react'
import { Calculator, BookOpen, MessageSquare } from 'lucide-react'
import { Button } from './ui/button'

interface NavbarProps {
  currentPage: 'home' | 'explain' | 'ai'
  onPageChange: (page: 'home' | 'explain' | 'ai') => void
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">
              工资谈判助手
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={currentPage === 'home' ? 'default' : 'ghost'}
              onClick={() => onPageChange('home')}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              我的方案
            </Button>
            <Button
              variant={currentPage === 'explain' ? 'default' : 'ghost'}
              onClick={() => onPageChange('explain')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              原理解释
            </Button>
            <Button
              variant={currentPage === 'ai' ? 'default' : 'ghost'}
              onClick={() => onPageChange('ai')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              AI法务助手
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}