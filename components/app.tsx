'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit2, Check, X, Trash2, AlertCircle, Search, LogOut, User as UserIcon, Box, Menu, ArrowDownAZ, CalendarDays } from "lucide-react"
import { supabase } from "@/utils/supabase" // Importar el cliente de Supabase
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'  // Añadir esta importación al inicio
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import Image from 'next/image'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from 'next/link'
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

type Item = {
  id: string
  name: string
  description: string
  box_id: string
  created_at: string
}

type Box = {
  id: string
  name: string
  description: string
  created_at: string
  item_count: number
  items?: Item[]
}

type SearchResult = {
  item: Item
  boxId: string
  boxName: string
}

export function App() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [newBoxName, setNewBoxName] = useState('')
  const [newBoxDescription, setNewBoxDescription] = useState('')
  const [activeBox, setActiveBox] = useState<Box | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editItemName, setEditItemName] = useState('')
  const [editItemDescription, setEditItemDescription] = useState('')
  const [newBoxNameError, setNewBoxNameError] = useState('')
  const [editBoxNameError, setEditBoxNameError] = useState('')
  const [newItemNameError, setNewItemNameError] = useState('')
  const [editItemNameError, setEditItemNameError] = useState('')
  const [editingBox, setEditingBox] = useState<string | null>(null)
  const [editBoxName, setEditBoxName] = useState('')
  const [editBoxDescription, setEditBoxDescription] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [boxToDelete, setBoxToDelete] = useState<Box | null>(null)
  const [boxSearchTerm, setBoxSearchTerm] = useState('')
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'date'>('date'); // Establecer el estado inicial en 'date'
  const [userData, setUserData] = useState<{ name: string | null, email: string | null }>({
    name: null,
    email: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showNewBoxDescriptionLimit, setShowNewBoxDescriptionLimit] = useState(false)
  const [showEditBoxDescriptionLimit, setShowEditBoxDescriptionLimit] = useState(false)
  const [showNewBoxNameLimit, setShowNewBoxNameLimit] = useState(false)
  const [showEditBoxNameLimit, setShowEditBoxNameLimit] = useState(false)
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()
    fetchBoxes()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    setUserData({
      name: user.user_metadata?.full_name || 'Usuario',
      email: user.email || ''
    })
  }

  const fetchBoxes = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('boxes')
      .select('*, items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching boxes:', error)
    } else {
      setBoxes(data || [])
    }
    setIsLoading(false)
  }

  const addBox = async () => {
    const trimmedName = newBoxName.trim()
    if (trimmedName) {
      const { data: existingBoxes, error: fetchError } = await supabase
        .from('boxes')
        .select('*')
        .eq('name', trimmedName)
        .eq('user_id', user?.id || '')

      if (fetchError || !user) {
        console.error('Error checking existing boxes:', fetchError)
        return
      }

      if (existingBoxes && existingBoxes.length > 0) {
        setNewBoxNameError('Ya existe una caja con este nombre. Por favor, elige otro.')
        return
      }

      const { data, error } = await supabase
        .from('boxes')
        .insert({ 
          name: trimmedName, 
          description: newBoxDescription.trim(), 
          item_count: 0,
          user_id: user.id
        })
        .select()
      
      if (error) {
        console.error('Error adding box:', error)
        setNewBoxNameError('Error adding box. Please try again.')
      } else {
        const newBox = data[0]
        const updatedBoxes = [...boxes, newBox]

        if (sortOrder === 'alphabetical') {
          updatedBoxes.sort((a, b) => a.name.localeCompare(b.name))
        } else if (sortOrder === 'date') {
          updatedBoxes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }

        setBoxes(updatedBoxes)
        setNewBoxName('')
        setNewBoxDescription('')
        setNewBoxNameError('')
        setShowNewBoxDescriptionLimit(false)
        setShowNewBoxNameLimit(false)
      }
    } else {
      setNewBoxNameError('Por favor, ingrese un nombre para la caja.')
    }
  }

  const deleteBox = (box: Box) => {
    setBoxToDelete(box)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteBox = async () => {
    if (boxToDelete) {
      const { error } = await supabase
        .from('boxes')
        .delete()
        .eq('id', boxToDelete.id)
      if (error) {
        console.error('Error deleting box:', error)
      } else {
        setBoxes(boxes.filter(b => b.id !== boxToDelete.id))
        setIsDeleteDialogOpen(false)
        setBoxToDelete(null)
      }
    }
  }

  const startEditingBox = (box: Box) => {
    setEditingBox(box.id)
    setEditBoxName(box.name)
    setEditBoxDescription(box.description)
    setEditBoxNameError('')
    setShowEditBoxDescriptionLimit(false)
  }

  const saveEditBox = async () => {
    if (editingBox) {
      const trimmedName = editBoxName.trim()
      if (trimmedName) {
        const { data: existingBoxes, error: fetchError } = await supabase
          .from('boxes')
          .select('*')
          .eq('name', trimmedName)
          .neq('id', editingBox)

        if (fetchError) {
          console.error('Error checking existing boxes:', fetchError)
          return
        }

        if (existingBoxes && existingBoxes.length > 0) {
          setEditBoxNameError('Ya existe una caja con este nombre. Por favor, elige otro.')
          return
        }

        const { data, error } = await supabase
          .from('boxes')
          .update({ name: trimmedName, description: editBoxDescription.trim() })
          .eq('id', editingBox)
          .select()
        if (error) {
          console.error('Error updating box:', error)
          setEditBoxNameError('Error updating box. Please try again.')
        } else {
          const updatedBox = { 
            ...data[0], 
            items: activeBox?.items || []
          }

          setBoxes(boxes.map(box => 
            box.id === editingBox ? updatedBox : box
          ))

          if (activeBox?.id === editingBox) {
            setActiveBox(updatedBox)
          }

          setEditingBox(null)
          setEditBoxNameError('')
          setShowEditBoxDescriptionLimit(false)
          setShowEditBoxNameLimit(false)
        }
      } else {
        setEditBoxNameError('El nombre de la caja no puede estar vacío.')
      }
    }
  }

  const cancelEditBox = () => {
    setEditingBox(null)
    setEditBoxNameError('')
    setShowEditBoxDescriptionLimit(false)
    setShowEditBoxNameLimit(false)
  }

  const addItem = async () => {
    if (activeBox && newItemName.trim()) {
      const { data, error } = await supabase
        .from('items')
        .insert({
          name: newItemName.trim(),
          description: newItemDescription.trim(),
          box_id: activeBox.id
        })
        .select()
      if (error) {
        console.error('Error adding item:', error)
        setNewItemNameError('Error adding item. Please try again.')
      } else {
        await supabase
          .from('boxes')
          .update({ item_count: activeBox.item_count + 1 })
          .eq('id', activeBox.id)

        const updatedBox = { 
          ...activeBox, 
          items: [...(activeBox.items || []), data[0]],
          item_count: activeBox.item_count + 1 
        }
        setBoxes(boxes.map(box => box.id === activeBox.id ? updatedBox : box))
        setActiveBox(updatedBox)
        setNewItemName('')
        setNewItemDescription('')
        setNewItemNameError('')
        setIsAddingItem(false)
      }
    } else if (!newItemName.trim()) {
      setNewItemNameError('Por favor ingrese un nombre para el item.')
    }
  }

  const searchItems = async () => {
    if (searchTerm) {
      const { data, error } = await supabase
        .from('items')
        .select('*, boxes(id, name)')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      if (error) {
        console.error('Error searching items:', error)
      } else {
        setSearchResults(data.map((item: Item & { boxes: Box }) => ({
          item: item,
          boxId: item.boxes.id,
          boxName: item.boxes.name
        })))
      }
    } else {
      setSearchResults([])
    }
  }

  useEffect(() => {
    searchItems()
  }, [searchTerm])

  const openBox = async (boxId: string) => {
    const { data: boxData, error: boxError } = await supabase
      .from('boxes')
      .select('*')
      .eq('id', boxId)
      .single()
    
    if (boxError) {
      console.error('Error fetching box:', boxError)
      return
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('items')
      .select('*')
      .eq('box_id', boxId)
    
    if (itemsError) {
      console.error('Error fetching items:', itemsError)
      return
    }

    setActiveBox({ ...boxData, items: itemsData || [] })
    setIsDialogOpen(true)
    setIsAddingItem(false)
    setBoxSearchTerm('')
  }

  const startEditing = (item: Item) => {
    setEditingItem(item.id)
    setEditItemName(item.name)
    setEditItemDescription(item.description)
    setEditItemNameError('')
  }

  const saveEdit = async () => {
    if (activeBox && editingItem) {
      const trimmedName = editItemName.trim()
      if (trimmedName) {
        const { data, error } = await supabase
          .from('items')
          .update({ name: trimmedName, description: editItemDescription.trim() })
          .eq('id', editingItem)
          .select()
        if (error) {
          console.error('Error updating item:', error)
          setEditItemNameError('Error updating item. Please try again.')
        } else {
          const updatedItems = activeBox?.items?.map(item => 
            item.id === editingItem ? (data && data[0] ? data[0] : item) : item
          )
          setActiveBox({ ...activeBox, items: updatedItems })
          setEditingItem(null)
          setEditItemNameError('')
        }
      } else {
        setEditItemNameError('Item name cannot be empty.')
      }
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditItemNameError('')
  }

  const confirmDeleteItem = async () => {
    if (activeBox && itemToDelete) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemToDelete.id)
      if (error) {
        console.error('Error deleting item:', error)
      } else {
        const updatedItems = activeBox?.items?.filter(item => item.id !== itemToDelete.id)
        await supabase
          .from('boxes')
          .update({ item_count: activeBox.item_count - 1 })
          .eq('id', activeBox.id)

        const updatedBox = { ...activeBox, items: updatedItems, item_count: activeBox.item_count - 1 }
        setBoxes(boxes.map(box => box.id === activeBox.id ? updatedBox : box))
        setActiveBox(updatedBox)
        setIsDeleteItemDialogOpen(false)
        setItemToDelete(null)
      }
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const filteredBoxItems = activeBox?.items?.filter(item =>
    item.name.toLowerCase().includes(boxSearchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(boxSearchTerm.toLowerCase())
  ) || []

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const BoxSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-[125px] w-full rounded-lg" />
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden xl:flex fixed top-0 left-0 h-full w-[240px] border-r bg-white flex-col justify-between p-6 shadow-sm">
        <div className="flex flex-col">
          <div className="flex justify-center mb-10">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Goods Logo"
                width={120}
                height={36}
                priority
                className="h-auto"
              />
            </Link>
          </div>
        </div>
        
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-start gap-2 hover:bg-gray-100">
                <UserIcon className="h-5 w-5" />
                <span className="text-sm">{userData.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <span className="font-medium">{userData.name}</span>
                <span className="text-sm text-gray-500">{userData.email}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 p-3 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen px-4 sm:px-6 xl:px-8 xl:pl-[264px] py-6">
        <div className="max-w-[1400px] w-full mx-auto">
          {/* Mobile Header */}
          <div className="xl:hidden flex items-center justify-between py-4 mb-6">
            <Link href="/">
              <Image
                src="/logo.svg"
                alt="Goods Logo"
                width={120}
                height={36}
                priority
                className="h-auto"
              />
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] p-6 flex flex-col">
                <VisuallyHidden>
                  <DialogTitle>Menú de navegación</DialogTitle>
                  <DialogDescription>
                    Menú principal de navegación de la aplicación
                  </DialogDescription>
                </VisuallyHidden>
                <div className="flex justify-center">
                  <Link href="/">
                    <Image
                      src="/logo.svg"
                      alt="Goods Logo"
                      width={100}
                      height={30}
                      priority
                      className="h-auto mb-8"
                    />
                  </Link>
                </div>
                
                <div className="mt-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full flex items-center justify-start gap-2">
                        <UserIcon className="h-5 w-5" />
                        <span className="text-sm">{userData.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem className="flex flex-col items-start">
                        <span className="font-medium">{userData.name}</span>
                        <span className="text-sm text-gray-500">{userData.email}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Rest of the content */}
          <div className="py-6 px sm:px-8 2xl:px-4 flex-none">
            {/* Search Bar */}
            <div className="mb-8 relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-10 h-11 text-base"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Resultados de búsqueda - ahora con posición absoluta */}
              {searchTerm && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
                  <CardHeader className="p-6">
                    <CardTitle>Resultados de búsqueda</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {searchResults.length > 0 ? (
                      <div className="max-h-[31vh] overflow-y-auto">
                        <ul className="space-y-3">
                          {searchResults.map(result => (
                            <li 
                              key={result.item.id} 
                              className="p-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                              onClick={() => openBox(result.boxId)}
                            >
                              <strong className="text-base">{result.item.name}</strong>
                              {result.item.description && 
                                <p className="text-sm italic text-gray-600 mt-1">{result.item.description}</p>
                              }
                              <span className="text-sm text-gray-500 mt-1 block">
                                En la caja: {result.boxName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-500">No se encontraron items.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Formulario para agregar caja */}
            <Card className="mb-8 bg-gradient-to-br from-green-50 to-amber-50 rounded-xl shadow-sm max-w-2xl mx-auto">
              <CardHeader className="p-6">
                <CardTitle>Agregar Nueva Caja</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-col space-y-3">
                  {/* Formulario para agregar caja */}
                  <Input
                    type="text"
                    placeholder="Nombre de la caja"
                    value={newBoxName}
                    onChange={(e) => {
                      setNewBoxName(e.target.value.slice(0, 14))
                      setNewBoxNameError('')
                      setShowNewBoxNameLimit(e.target.value.length >= 14)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && addBox()}
                    maxLength={14}
                    className="h-11"
                  />
                  <Input
                    type="text"
                    placeholder="Descripción de la caja"
                    value={newBoxDescription}
                    onChange={(e) => {
                      setNewBoxDescription(e.target.value.slice(0, 54))
                      setShowNewBoxDescriptionLimit(e.target.value.length >= 54)
                    }}
                    maxLength={54}
                    className="h-11"
                  />
                  {showNewBoxDescriptionLimit && (
                    <p className="text-sm text-red-500">Has alcanzado el límite de caracteres permitidos</p>
                  )}
                  {showNewBoxNameLimit && (
                    <p className="text-sm text-red-500">Has alcanzado el límite de 14 caracteres</p>
                  )}
                  <div className="flex sm:justify-end pt-2">
                    <Button onClick={addBox} className="w-full sm:w-auto">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Agregar Caja
                    </Button>
                  </div>
                  {newBoxNameError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{newBoxNameError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botones de ordenación */}
            <div className="flex flex-col sm:flex-row sm:justify-center gap-2 sm:gap-6 mb-8">
              <Button 
                variant="link" 
                onClick={() => {
                  setBoxes([...boxes].sort((a, b) => a.name.localeCompare(b.name)));
                  setSortOrder('alphabetical');
                }} 
                className={`${sortOrder === 'alphabetical' ? 'underline font-medium' : ''} text-sm sm:text-base`}
              >
                <ArrowDownAZ className="h-4 w-4 mr-2" />
                Ordenar Alfabéticamente
              </Button>
              <Button 
                variant="link" 
                onClick={() => {
                  setBoxes([...boxes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                  setSortOrder('date');
                }} 
                className={`${sortOrder === 'date' ? 'underline font-medium' : ''} text-sm sm:text-base`}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Ordenar por Fecha de Creación
              </Button>
            </div>

            {/* Lista de cajas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Mostrar 6 skeletons mientras carga
                <>
                  {[...Array(6)].map((_, i) => (
                    <BoxSkeleton key={i} />
                  ))}
                </>
              ) : (
                // Mostrar las cajas cuando termina de cargar
                boxes.map(box => (
                  <Card key={box.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-5">
                      {editingBox === box.id ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            value={editBoxName}
                            onChange={(e) => {
                              setEditBoxName(e.target.value.slice(0, 14))
                              setEditBoxNameError('')
                              setShowEditBoxNameLimit(e.target.value.length >= 14)
                            }}
                            placeholder={box.name}
                            maxLength={14}
                          />
                          <Input
                            type="text"
                            value={editBoxDescription}
                            onChange={(e) => {
                              setEditBoxDescription(e.target.value.slice(0, 54))
                              setShowEditBoxDescriptionLimit(e.target.value.length >= 54)
                            }}
                            placeholder="Descripción de la caja"
                            maxLength={54}
                          />
                          {showEditBoxDescriptionLimit && (
                            <p className="text-sm text-red-500">Has alcanzado el límite de caracteres permitidos</p>
                          )}
                          {showEditBoxNameLimit && (
                            <p className="text-sm text-red-500">Has alcanzado el límite de 14 caracteres</p>
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button onClick={saveEditBox} size="sm">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button onClick={cancelEditBox} variant="outline" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {editBoxNameError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{editBoxNameError}</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      ) : (
                        <CardTitle className="flex justify-between items-center">
                          <div className="flex items-center gap-3 min-w-0">
                            <span 
                              className="box-name truncate max-w-[9rem] sm:max-w-[9.2rem] 2xl:max-w-[14.5rem]"
                            >
                              {box.name}
                            </span>
                            <Badge className="shrink-0">{box.item_count} items</Badge>
                          </div>
                          <div className="flex shrink-0 ml-2">
                            <Button onClick={() => startEditingBox(box)} variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-electric-blue">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => deleteBox(box)} variant="ghost" size="sm" className='h-8 w-8 p-0 hover:bg-electric-blue'>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      )}
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="mt-2 min-h-[3rem]">
                        {box.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{box.description}</p>}
                      </div>
                      <Button onClick={() => openBox(box.id)} className="mb-4">Ver Items</Button>
                      
                      {/* Mostrar los tres primeros items */}
                      {box.items && box.items.length > 0 && (
                    <ul className="space-y-1">
                      {box.items.slice(0, 3).map(item => (
                        <li key={item.id} className="text-sm text-gray-600 truncate">
                          • {item.name}
                        </li>
                      ))}
                      {box.items.length > 3 && (
                        <li className="text-sm text-gray-400">
                          • {box.items.length - 3} {box.items.length - 3 === 1 ? 'item más...' : 'items más...'}
                        </li>
                      )}
                    </ul>
                  )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Diálogo para ver items de la caja */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[800px] h-[90vh] sm:h-[85vh] flex flex-col rounded-xl p-6">
                <DialogHeader className="flex-none">
                  <DialogTitle className="flex justify-between items-center text-xl">
                    {activeBox?.name}
                    <Badge className="mr-4">{activeBox?.item_count} items</Badge>
                  </DialogTitle>
                </DialogHeader>
                
                {/* Descripción de la caja */}
                <div className="flex-none min-h-[40px] text-sm text-gray-500">
                  {activeBox?.description}
                </div>
                
                {/* Contenedor principal */}
                <div className="flex flex-col flex-1 min-h-0"> {/* min-h-0 es crucial para el scroll */}
                  {/* Formulario de primer item o barra de búsqueda - siempre visible */}
                  <div className="flex-none mb-4"> {/* flex-none para que no se encoja */}
                    {activeBox && (!activeBox.items || activeBox.items.length === 0) ? (
                      <div className="space-y-3">
                        <Input
                          type="text"
                          placeholder="Nombre del primer item"
                          value={newItemName}
                          onChange={(e) => {
                            setNewItemName(e.target.value)
                            setNewItemNameError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newItemName.trim()) {
                              (document.querySelector('input[placeholder="Descripción del item"]') as HTMLInputElement)?.focus()
                            }
                          }}
                        />
                        <Input
                          type="text"
                          placeholder="Descripción del item"
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        />
                        <Button onClick={addItem} className="w-full">Agregar Primer Item</Button>
                        {newItemNameError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{newItemNameError}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative mb-4">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Buscar items en esta caja..."
                            value={boxSearchTerm}
                            onChange={(e) => setBoxSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button onClick={() => setIsAddingItem(true)} className="w-full">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Agregar Nuevo Item
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Formulario para agregar nuevo item - si está activo */}
                  {isAddingItem && (
                    <div className="flex-none space-y-2 mb-6"> {/* Aumentado el margen inferior */}
                      <Input
                        type="text"
                        placeholder="Nombre del item"
                        value={newItemName}
                        onChange={(e) => {
                          setNewItemName(e.target.value)
                          setNewItemNameError('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newItemName.trim()) {
                            (document.querySelector('input[placeholder="Descripción del item"]') as HTMLInputElement)?.focus()
                          }
                        }}
                      />
                      <Input
                        type="text"
                        placeholder="Descripción del item"
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                      />
                      <Button onClick={addItem}>Agregar Item</Button>
                      {newItemNameError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{newItemNameError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Separador visual */}
                  <div className="flex-none h-px bg-gray-100 mb-6"></div>

                  {/* Lista de items con scroll */}
                  <div className="flex-1 overflow-y-auto min-h-0"> {/* min-h-0 permite que el scroll funcione */}
                    <ul className="space-y-3"> {/* Aumentado el espacio entre items */}
                      {filteredBoxItems.map((item: Item) => (
                        <li key={item.id} className="p-3 border rounded"> {/* Aumentado el padding */}
                          {editingItem === item.id ? (
                            <div className="space-y-2">
                              <Input
                                type="text"
                                value={editItemName}
                                onChange={(e) => {
                                  setEditItemName(e.target.value)
                                  setEditItemNameError('')
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editItemName.trim()) {
                                    (document.querySelector('input[value="' + editItemDescription + '"]') as HTMLInputElement)?.focus()
                                  }
                                }}
                                placeholder={item.name}
                              />
                              <Input
                                type="text"
                                value={editItemDescription}
                                onChange={(e) => setEditItemDescription(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                placeholder={item.description || "Descripción del item"}
                              />
                              <div className="flex space-x-2">
                                <Button onClick={saveEdit} size="sm">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button onClick={cancelEdit} variant="outline" size="sm">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              {editItemNameError && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertDescription>{editItemNameError}</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1 mr-2">
                                <span className="font-semibold line-clamp-2 block">
                                  {item.name}
                                </span>
                                <span className="text-sm text-gray-500 line-clamp-2 block">
                                  {item.description}
                                </span>
                              </div>
                              <div className="flex-shrink-0">
                                <Button 
                                  onClick={() => startEditing(item)} 
                                  variant="ghost" 
                                  size="sm" 
                                  className="mr-1 hover:bg-electric-blue"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setItemToDelete(item)
                                    setIsDeleteItemDialogOpen(true)
                                  }} 
                                  variant="ghost" 
                                  size="sm" 
                                  className='hover:bg-electric-blue'
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar caja */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Confirmar eliminación</DialogTitle>
                  <DialogDescription>
                    Está seguro de que desea eliminar la caja &quot;{boxToDelete?.name}&quot;? Esta acción eliminará todos los items dentro de la caja y no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">Cancelar</Button>
                  <Button onClick={confirmDeleteBox} variant="destructive">Eliminar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Diálogo de confirmación para eliminar item */}
            <Dialog open={isDeleteItemDialogOpen} onOpenChange={setIsDeleteItemDialogOpen}>
              <DialogContent className="max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Confirmar eliminación de item</DialogTitle>
                  <DialogDescription>
                    ¿Está seguro de que desea eliminar el item &quot;{itemToDelete?.name}&quot;? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => setIsDeleteItemDialogOpen(false)} variant="outline">Cancelar</Button>
                  <Button onClick={confirmDeleteItem} variant="destructive">Eliminar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  )
}
