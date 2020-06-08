import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import AddItem from './components/AddItem';
import ListItem from './components/ListItem';

const App = () => {
  const [items, setItems] = useState([
    {id: uuidv4(), text: 'Milk' },
    {id: uuidv4(), text: 'Eggs' },
    {id: uuidv4(), text: 'Bread' },
    {id: uuidv4(), text: 'Juice' }
  ]);

  const [text, setText] = useState('Hola Papi!');

  const deleteItem = (id) => {
    setItems(prevItems => {
      return prevItems.filter(item => item.id != id);
    });
  }

  const addItem = text => {
    if(!text) {
      Alert.alert('Error', 'Please enter an item', [{ text: 'Aceptar' }]);
    } else {
      setItems(prevItems => {
        return [{id: uuidv4(), text}, ...prevItems]
      });
    }
  }

  const addText = (valor) => {
    // setText(e.target.value)
    setText(valor)
  }

  return (
    <View style={styles.container}>
      <Header />
      <SearchBar holaMierda={addText} />
      <FlatList 
      data={items} 
      renderItem={({item}) => <ListItem item={item} deleteItem={deleteItem} />}
      />
      <AddItem addItem={addItem} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  text: {
    textAlign: 'center'
  }
});

export default App;
