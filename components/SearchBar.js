import React from 'react';
import { View, StyleSheet, TextInput } from 'react-native';

const SearchBar = ({holaMierda}) => {
    return (
        <View style={styles.container}>
            <TextInput style={styles.search} placeholder='Buscar good...' onChangeText={holaMierda} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        /* flex: 1,
        flexDirection: 'row',
        justifyContent: 'center', */
        margin: 15,
        alignItems: 'center',
    },
    search: {
        width: '90%',
        height: 38,
        padding: 7,
        fontSize: 12,
        borderWidth: 0.5,
        borderRadius: 7
    }
});

export default SearchBar;
