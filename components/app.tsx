'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit2, Check, X, Trash2, AlertCircle, Search, LogOut, User as UserIcon, Box } from "lucide-react"
import { supabase } from "@/utils/supabase" // Importar el cliente de Supabase
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'  // Añadir esta importación al inicio
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

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
        }
      } else {
        setEditBoxNameError('El nombre de la caja no puede estar vacío.')
      }
    }
  }

  const cancelEditBox = () => {
    setEditingBox(null)
    setEditBoxNameError('')
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
      setNewItemNameError('Please enter a name for the item.')
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
    <div className="container mx-auto px-4 py-2 sm:py-4">
      <div className="flex flex-col">
        <div className="flex justify-end mb-2 sm:mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="h-10 w-10 rounded-full p-0 border-2 fixed sm:relative top-2 right-4 sm:top-auto sm:right-auto z-10"
              >
                <UserIcon className="h-5 w-5 text-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
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

        <h1 className="text-3xl font-bold mb-4 mt-12 sm:mt-0">Goods</h1>
        
        {/* Barra de búsqueda principal */}
        <div className="mb-4 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Resultados de búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                  <ul>
                    {searchResults.map(result => (
                      <li 
                        key={result.item.id} 
                        className="mb-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                        onClick={() => openBox(result.boxId)}
                      >
                        <strong>{result.item.name}</strong>
                        {result.item.description && ` - ${result.item.description}`}
                        <br />
                        <span className="text-sm text-gray-500">En la caja: {result.boxName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No se encontraron items.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulario para agregar caja */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Agregar Nueva Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              {/* Formulario para agregar caja */}
              <Input
                type="text"
                placeholder="Nombre de la caja"
                value={newBoxName}
                onChange={(e) => {
                  setNewBoxName(e.target.value)
                  setNewBoxNameError('')
                }}
                onKeyPress={(e) => e.key === 'Enter' && addBox()}
              />
              <Input
                type="text"
                placeholder="Descripción de la caja (máx. 54 caracteres)"
                value={newBoxDescription}
                onChange={(e) => setNewBoxDescription(e.target.value.slice(0, 54))}
                maxLength={54}
              />
              <div className="flex sm:hidden">
                <Button onClick={addBox} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Caja
                </Button>
              </div>
              <div className="hidden sm:flex sm:justify-end">
                <Button onClick={addBox}>
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
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 mb-4">
          <Button 
            variant="link" 
            onClick={() => {
              setBoxes([...boxes].sort((a, b) => a.name.localeCompare(b.name)));
              setSortOrder('alphabetical');
            }} 
            className={`${sortOrder === 'alphabetical' ? 'underline' : ''} text-sm sm:text-base`}
          >
            Ordenar Alfabéticamente
          </Button>
          <Button 
            variant="link" 
            onClick={() => {
              setBoxes([...boxes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
              setSortOrder('date');
            }} 
            className={`${sortOrder === 'date' ? 'underline' : ''} text-sm sm:text-base`}
          >
            Ordenar por Fecha de Creación
          </Button>
        </div>

        {/* Lista de cajas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Card key={box.id} className="mb-2 sm:mb-4">
                <CardHeader className="p-4 sm:p-6">
                  {editingBox === box.id ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={editBoxName}
                        onChange={(e) => {
                          setEditBoxName(e.target.value)
                          setEditBoxNameError('')
                        }}
                        placeholder={box.name}
                      />
                      <Input
                        type="text"
                        value={editBoxDescription}
                        onChange={(e) => setEditBoxDescription(e.target.value.slice(0, 54))}
                        placeholder="Descripción de la caja (máx. 54 caracteres)"
                        maxLength={54}
                      />
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
                      <div>
                        {box.name}
                        <Badge variant="secondary" className="ml-2">{box.item_count} items</Badge>
                      </div>
                      <div>
                        <Button onClick={() => startEditingBox(box)} variant="ghost" size="sm" className="mr-1">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteBox(box)} variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {box.description && <p className="text-sm text-gray-500 mb-2">{box.description}</p>}
                  <Button onClick={() => openBox(box.id)} className="mb-2">Ver Items</Button>
                  
                  {/* Mostrar los tres primeros items */}
                  <ul className="space-y-1">
                    {box.items && box.items.slice(0, 3).map(item => (
                      <li key={item.id} className="text-sm text-gray-700">
                        {item.name} {item.description && `- ${item.description}`}
                      </li>
                    ))}
                    {box.items && box.items.length > 3 && (
                      <li className="text-sm text-gray-500">...</li> // Puntos suspensivos si hay más de 3 items
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Diálogo para ver items de la caja */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[800px] h-[90vh] sm:h-auto overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                {activeBox?.name}
                <Badge variant="secondary">{activeBox?.item_count} items</Badge>
              </DialogTitle>
              {activeBox?.description && (
                <DialogDescription>
                  {activeBox.description}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {activeBox && activeBox.items && activeBox.items.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar items en esta caja..."
                    value={boxSearchTerm}
                    onChange={(e) => setBoxSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              {activeBox && activeBox.items && activeBox.items.length > 0 ? (
                <Button onClick={() => setIsAddingItem(true)} className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Nuevo Item
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nombre del primer item"
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value)
                      setNewItemNameError('')
                    }}
                    onKeyDown={(e) => { // Cambiado de onKeyPress a onKeyDown
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
                    onKeyDown={(e) => e.key === 'Enter' && addItem()} // Cambiado de onKeyPress a onKeyDown
                  />
                  <Button onClick={addItem} className="w-full">Agregar Primer Item</Button>
                  {newItemNameError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{newItemNameError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              {isAddingItem && (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nombre del item"
                    value={newItemName}
                    onChange={(e) => {
                      setNewItemName(e.target.value)
                      setNewItemNameError('')
                    }}
                    onKeyPress={(e) => {
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
                    onKeyPress={(e) => e.key === 'Enter' && addItem()}
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
              <div className="max-h-[50vh] overflow-y-auto">
                <ul className="space-y-2">
                  {filteredBoxItems.map((item: Item) => (
                    <li key={item.id} className="p-2 border rounded">
                      {editingItem === item.id ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            value={editItemName}
                            onChange={(e) => {
                              setEditItemName(e.target.value)
                              setEditItemNameError('')
                            }}
                            onKeyDown={(e) => { // Cambiado de onKeyPress a onKeyDown
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
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()} // Cambiado de onKeyPress a onKeyDown
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
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold">{item.name}</span>
                            <br />
                            <span className="text-sm text-gray-500">{item.description}</span>
                          </div>
                          <div>
                            <Button onClick={() => startEditing(item)} variant="ghost" size="sm" className="mr-1">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => {
                              setItemToDelete(item)
                              setIsDeleteItemDialogOpen(true)
                            }} variant="ghost" size="sm">
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
          <DialogContent>
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
          <DialogContent>
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
  )
}
