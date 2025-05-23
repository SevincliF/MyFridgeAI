import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import {FAB} from '@rneui/themed';
import firestore from '@react-native-firebase/firestore';
import {getAuth} from '@react-native-firebase/auth';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import useModal from '../hooks/useModal';
import CustomModal from '../components/CustomModal';

const FridgeScreen = () => {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  const {visible, modalConfig, showModal, hideModal, showSuccess, showError, showConfirm} = useModal();

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['60%'], []);
  const insets = useSafeAreaInsets();

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.8}
        pressBehavior="close"
      />
    ),
    []
  );

  const fetchFridgeItems = useCallback(() => {
    if (!userId) return;

    setLoading(true);

    firestore()
      .collection('fridgeItems')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        querySnapshot => {
          const items = [];
          querySnapshot.forEach(doc => {
            items.push({
              id: doc.id,
              ...doc.data(),
            });
          });

          setFridgeItems(items);
          setLoading(false);
        },
        error => {
          console.error('Buzdolabı ürünleri alınırken hata:', error);
          console.log('error==>', error);
          setLoading(false);
          showError('Hata', 'Ürünler yüklenirken bir sorun oluştu.');
        },
      );
  }, [userId, showError]);

  useEffect(() => {
    fetchFridgeItems();
  }, [fetchFridgeItems]);

  const openAddItemSheet = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    bottomSheetRef.current?.expand();
  };

  const openEditItemSheet = item => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity);
    bottomSheetRef.current?.expand();
  };

  const handleSaveItem = async () => {
    if (!newItemName.trim()) {
      showError('Hata', 'Ürün adı boş olamaz');
      return;
    }

    try {
      if (editingItem) {
        await firestore().collection('fridgeItems').doc(editingItem.id).update({
          name: newItemName,
          quantity: newItemQuantity,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        closeBottomSheet();
      } else {
        await firestore().collection('fridgeItems').add({
          userId,
          name: newItemName,
          quantity: newItemQuantity,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      
      setNewItemName('');
      setNewItemQuantity('');
      setEditingItem(null);
      
      showSuccess('Başarılı', editingItem ? 'Ürün güncellendi.' : 'Ürün eklendi.');
    } catch (error) {
      console.error('Ürün kaydedilirken hata oluştu:', error);
      showError('Hata', 'Ürün kaydedilirken bir sorun oluştu.');
    }
  };

  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleDeleteItem = async itemId => {
    showConfirm(
      'Ürünü Sil',
      'Bu ürünü buzdolabınızdan silmek istediğinize emin misiniz?',
      async () => {
        try {
          await firestore().collection('fridgeItems').doc(itemId).delete();
        } catch (error) {
          console.error('Ürün silinirken hata oluştu:', error);
          showError('Hata', 'Ürün silinirken bir sorun oluştu.');
        }
      }
    );
  };

  const renderFridgeItem = ({item}) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => openEditItemSheet(item)}>
      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.itemQuantity}>{item.quantity}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Buzdolabım</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : fridgeItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Buzdolabınızda hiç ürün bulunmuyor.
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Sağ alttaki + butonuna basarak ürün ekleyebilirsiniz.
          </Text>
        </View>
      ) : (
        <FlatList
          data={fridgeItems}
          renderItem={renderFridgeItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContainer,
            {paddingBottom: Platform.OS === 'ios' ? 60 + insets.bottom : 120},
          ]}
        />
      )}

      <FAB
        icon={{name: 'add', color: 'white'}}
        color="#4285F4"
        placement="right"
        onPress={openAddItemSheet}
        style={[
          styles.fab,
          {bottom: Platform.OS === 'ios' ? insets.bottom + 60 : 90},
        ]}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableBackdropPress={true}
        backdropComponent={renderBackdrop}
        handleComponent={null}
        style={styles.bottomSheet}
        onChange={handleSheetChanges}>
        <BottomSheetView style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>
              {editingItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
            </Text>
            <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetTextInput
            style={styles.input}
            placeholder="Ürün Adı"
            placeholderTextColor={'#888'}
            value={newItemName}
            onChangeText={setNewItemName}
          />

          <BottomSheetTextInput
            style={styles.input}
            placeholder="Miktar (örn: 1 kg, 2 adet)"
            placeholderTextColor={'#888'}
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
          
          {editingItem && (
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={() => {
                closeBottomSheet();
                handleDeleteItem(editingItem.id);
              }}>
              <Text style={styles.deleteButtonText}>Sil</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>

      <CustomModal
        visible={visible}
        title={modalConfig.title}
        message={modalConfig.message}
        buttons={modalConfig.buttons}
        onClose={hideModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4e8ed',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  listContainer: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: Dimensions.get('window').width / 2 - 24,
    height: Dimensions.get('window').width / 2 - 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4285F4',
  },
  deleteButton: {
    backgroundColor: '#db4437',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    flex: 1,
    padding: 24,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FridgeScreen;
