'use client'

import { useState, useEffect, KeyboardEvent, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Edit2, Check, X, Trash2, AlertCircle, Search } from "lucide-react"

type Item = {
  id: string
  name: string
  description: string
}

type Box = {
  id: string
  name: string
  description: string
  items: Item[]
  itemCount: number
}

type SearchResult = {
  item: Item
  boxId: string
  boxName: string
}

export function App() {
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

  const searchItems = useCallback(() => {
    return boxes.flatMap(box => 
      box.items
        .filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(item => ({
          item,
          boxId: box.id,
          boxName: box.name
        }))
    )
  }, [boxes, searchTerm])

  useEffect(() => {
    setSearchResults(searchItems())
  }, [searchItems])

  const addBox = () => {
    const trimmedName = newBoxName.trim()
    if (trimmedName) {
      if (boxes.some(box => box.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
        setNewBoxNameError('Ya existe una caja con este nombre.')
      } else {
        const newBox: Box = {
          id: Date.now().toString(),
          name: trimmedName,
          description: newBoxDescription.trim(),
          items: [],
          itemCount: 0
        }
        setBoxes([...boxes, newBox])
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

  const confirmDeleteBox = () => {
    if (boxToDelete) {
      setBoxes(boxes.filter(b => b.id !== boxToDelete.id))
      setIsDeleteDialogOpen(false)
      setBoxToDelete(null)
    }
  }

  const startEditingBox = (box: Box) => {
    setEditingBox(box.id)
    setEditBoxName(box.name)
    setEditBoxDescription(box.description)
    setEditBoxNameError('')
  }

  const saveEditBox = () => {
    if (editingBox) {
      const trimmedName = editBoxName.trim()
      if (trimmedName) {
        if (boxes.some(box => box.id !== editingBox && box.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
          setEditBoxNameError('Ya existe una caja con este nombre.')
        } else {
          setBoxes(boxes.map(box => 
            box.id === editingBox
              ? { ...box, name: trimmedName, description: editBoxDescription.trim() }
              : box
          ))
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

  const addItem = () => {
    if (activeBox && newItemName.trim()) {
      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        description: newItemDescription.trim()
      }
      const updatedBoxes = boxes.map(box => 
        box.id === activeBox.id 
          ? { ...box, items: [...box.items, newItem], itemCount: box.itemCount + 1 }
          : box
      )
      setBoxes(updatedBoxes)
      setActiveBox({ ...activeBox, items: [...activeBox.items, newItem], itemCount: activeBox.itemCount + 1 })
      setNewItemName('')
      setNewItemDescription('')
      setNewItemNameError('')
      setIsAddingItem(false)
    } else if (!newItemName.trim()) {
      setNewItemNameError('Por favor, ingrese un nombre para el item.')
    }
  }

  const openBox = (boxId: string) => {
    const box = boxes.find(b => b.id === boxId)
    if (box) {
      setActiveBox(box)
      setIsDialogOpen(true)
      setIsAddingItem(false)
      setBoxSearchTerm('')
    }
  }

  const startEditing = (item: Item) => {
    setEditingItem(item.id)
    setEditItemName(item.name)
    setEditItemDescription(item.description)
    setEditItemNameError('')
  }

  const saveEdit = () => {
    if (activeBox && editingItem) {
      const trimmedName = editItemName.trim()
      if (trimmedName) {
        const updatedBoxes = boxes.map(box => {
          if (box.id === activeBox.id) {
            const updatedItems = box.items.map(item => 
              item.id === editingItem
                ? { ...item, name: trimmedName, description: editItemDescription.trim() }
                : item
            )
            return { ...box, items: updatedItems }
          }
          return box
        })
        setBoxes(updatedBoxes)
        setActiveBox(updatedBoxes.find(box => box.id === activeBox.id) || null)
        setEditingItem(null)
        setEditItemNameError('')
      } else {
        setEditItemNameError('El nombre del item no puede estar vacío.')
      }
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditItemNameError('')
  }

  const confirmDeleteItem = () => {
    if (activeBox && itemToDelete) {
      const updatedBoxes = boxes.map(box => {
        if (box.id === activeBox.id) {
          const updatedItems = box.items.filter(item => item.id !== itemToDelete.id)
          return { ...box, items: updatedItems, itemCount: updatedItems.length }
        }
        return box
      })
      setBoxes(updatedBoxes)
      const updatedActiveBox = updatedBoxes.find(box => box.id === activeBox.id)
      setActiveBox(updatedActiveBox || null)
      setIsDeleteItemDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const filteredBoxItems = activeBox?.items.filter(item =>
    item.name.toLowerCase().includes(boxSearchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(boxSearchTerm.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Inventario Personal</h1>
      
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
            <Input
              type="text"
              placeholder="Nombre de la caja"
              value={newBoxName}
              onChange={(e) => {
                setNewBoxName(e.target.value)
                setNewBoxNameError('')
              }}
              onKeyPress={(e) => handleKeyPress(e, addBox)}
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

      {/* Lista de cajas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boxes.map(box => (
          <Card key={box.id} className="mb-4">
            <CardHeader>
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
                    <Badge variant="secondary" className="ml-2">{box.itemCount} items</Badge>
                  
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
            <CardContent>
              {box.description && <p className="text-sm text-gray-500 mb-2">{box.description}</p>}
              <Button onClick={() => openBox(box.id)} className="mb-2">Ver Items</Button>
              <ul>
                {box.items.slice(0, 3).map(item => (
                  <li key={item.id}>{item.name}</li>
                ))}
                {box.items.length > 3 && <li>...</li>}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo para ver items de la caja */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] lg:max-w-[800px] w-[90vw] h-[90vh] sm:h-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              {activeBox?.name}
              <Badge variant="secondary">{activeBox?.itemCount} items</Badge>
            </DialogTitle>
            {activeBox?.description && (
              <DialogDescription>
                {activeBox.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {activeBox && activeBox.items.length > 0 && (
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
            {activeBox && activeBox.items.length > 0 ? (
              <Button onClick={() => setIsAddingItem(true)} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar Item
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
                  onKeyPress={(e) => handleKeyPress(e, addItem)}
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
                  onKeyPress={(e) => handleKeyPress(e, addItem)}
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
                {filteredBoxItems.map(item => (
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
                          onKeyPress={(e) => {
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
                          onKeyPress={(e) => handleKeyPress(e, saveEdit)}
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
              ¿Está seguro de que desea eliminar la caja &quot;{boxToDelete?.name}&quot;? Esta acción eliminará todos los items dentro de la caja y no se puede deshacer.
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
  )
}