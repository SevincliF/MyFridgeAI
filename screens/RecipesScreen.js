import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { FAB } from '@rneui/themed';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetTextInput, 
  BottomSheetScrollView,
  BottomSheetBackdrop
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { generateRecipe } from '../services/openai';
import CustomModal from '../components/CustomModal';
import useModal from '../hooks/useModal';

const RecipesScreen = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [fridgeItems, setFridgeItems] = useState([]);
  
  // Modal hook
  const { visible, modalConfig, showModal, hideModal, showSuccess, showError, showConfirm } = useModal();
  
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['80%'], []);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  const insets = useSafeAreaInsets();
  
  const navigation = useNavigation();
  
  // Backdrop component için custom renderBackdrop
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
  
  // Buzdolabındaki ürünleri getir
  const fetchFridgeItems = useCallback(async () => {
    if (!userId) return;
    
    try {
      const snapshot = await firestore()
        .collection('fridgeItems')
        .where('userId', '==', userId)
        .get();
      
      const items = [];
      snapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setFridgeItems(items);
    } catch (error) {
      console.error('Buzdolabı ürünleri alınırken hata:', error);
    }
  }, [userId]);

  // Tarifleri getir
  const fetchRecipes = useCallback(() => {
    if (!userId) return;
    
    setLoading(true);
    
    firestore()
      .collection('recipes')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (querySnapshot) => {
          const recipeList = [];
          querySnapshot.forEach((doc) => {
            recipeList.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setRecipes(recipeList);
          setLoading(false);
        },
        (error) => {
          console.error('Tarifler alınırken hata:', error);
          setLoading(false);
          showError('Hata', 'Tarifler yüklenirken bir sorun oluştu.');
        }
      );
  }, [userId, showError]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Bottom sheet'i aç
  const openRecipeRequestSheet = async () => {
    await fetchFridgeItems();
    setRecipeQuery('');
    bottomSheetRef.current?.expand();
  };

  // OpenAI API'den tarif iste
  const handleGenerateRecipe = async () => {
    if (fridgeItems.length === 0) {
      showError('Hata', 'Buzdolabınızda ürün bulunmuyor. Önce ürün ekleyin.');
      return;
    }

    setGeneratingRecipe(true);
    
    try {
      // Kullanıcı bilgilerini ve tercihlerini al
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data() || {};
      const allergies = userData.allergies || [];
      const otherAllergies = userData.otherAllergies || '';
      const dietPreferences = userData.dietPreferences || [];
      
      // Diğer alerjileri de dahil et
      let allAllergies = [...allergies];
      if (otherAllergies) {
        // Virgülle ayrılmış metni diziye çevir ve ana diziye ekle
        const otherAllergiesList = otherAllergies.split(',').map(item => item.trim()).filter(item => item);
        allAllergies = [...allAllergies, ...otherAllergiesList];
      }
      
      console.log(allAllergies);
      // Ürün listesini hazırla
      const ingredients = fridgeItems.map(item => `${item.name} (${item.quantity})`).join(', ');
      
      // OpenAI API'ye istek gönder
      const generatedRecipe = await generateRecipe(
        ingredients,
        recipeQuery,
        allAllergies,
        dietPreferences
      );
      
      // Tarifi Firestore'a kaydet
      const recipeData = {
        userId,
        title: generatedRecipe.title,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        createdAt: firestore.FieldValue.serverTimestamp()
      };
      
      await firestore()
        .collection('recipes')
        .add(recipeData);
      
      setGeneratingRecipe(false);
      showSuccess('Başarılı', 'Yeni tarif oluşturuldu!');
      closeBottomSheet();
      
      // Form alanını sıfırla
      setRecipeQuery('');
    } catch (error) {
      console.error('Tarif oluşturulurken hata:', error);
      setGeneratingRecipe(false);
      showError('Hata', 'Tarif oluşturulurken bir sorun oluştu.');
    }
  };
  
  // BottomSheet'i kapat
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  
  // Backdrop animasyonu için handleSheetChanges
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);
  
  // Tarif sil
  const handleDeleteRecipe = async (recipeId) => {
    showConfirm(
      'Tarifi Sil',
      'Bu tarifi silmek istediğinize emin misiniz?',
      async () => {
        try {
          await firestore()
            .collection('recipes')
            .doc(recipeId)
            .delete();
            
          showSuccess('Başarılı', 'Tarif başarıyla silindi.');
        } catch (error) {
          console.error('Tarif silinirken hata oluştu:', error);
          showError('Hata', 'Tarif silinirken bir sorun oluştu.');
        }
      }
    );
  };

  // Tarif kartı render
  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeCard}>
      <TouchableOpacity 
        style={styles.recipeContent}
        onPress={() => viewRecipeDetails(item)}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons name="chef-hat" size={48} color="#ffffff" />
          </View>
        </View>
        
        <Text style={styles.recipeTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        
      </TouchableOpacity>
    </View>
  );

  // Tarif detaylarını görüntüle
  const viewRecipeDetails = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tarifler</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4285F4" />
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Henüz kaydedilmiş tarif bulunmuyor.
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Sağ alttaki + butonuna basarak tarif oluşturabilirsiniz.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Platform.OS === 'ios' ? 60 + insets.bottom : 120 }
          ]}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
      
      <FAB
        icon={{ name: 'add', color: 'white' }}
        color="#4285F4"
        placement="right"
        onPress={openRecipeRequestSheet}
        style={[
          styles.fab,
          {bottom: Platform.OS === 'ios' ? insets.bottom + 60 : 90},
        ]}
      />
      
      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableBackdropPress={true}
        backdropComponent={renderBackdrop}
        handleComponent={null}
        style={styles.bottomSheet}
        onChange={handleSheetChanges}
      >
        <BottomSheetScrollView style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Tarif Oluştur</Text>
            <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>Buzdolabı Ürünleri</Text>
          {fridgeItems.length === 0 ? (
            <Text style={styles.emptyItemsText}>
              Buzdolabınızda henüz ürün bulunmuyor. Tarif oluşturmak için önce buzdolabınıza ürün ekleyin.
            </Text>
          ) : (
            <BottomSheetView style={styles.itemsList}>
              {fridgeItems.map((item) => (
                <BottomSheetView key={item.id} style={styles.itemChip}>
                  <Text style={styles.itemChipText}>
                    {item.name} ({item.quantity})
                  </Text>
                </BottomSheetView>
              ))}
            </BottomSheetView>
          )}
          
          <Text style={styles.sectionTitle}>İstekleriniz (Opsiyonel)</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="Örn: Hızlı bir akşam yemeği, sağlıklı bir tarif..."
            placeholderTextColor={'#888'}
            value={recipeQuery}
            onChangeText={setRecipeQuery}
            multiline
          />
          
          <TouchableOpacity 
            style={styles.generateButton} 
            onPress={handleGenerateRecipe}
            disabled={generatingRecipe || fridgeItems.length === 0}
          >
            <Text style={styles.generateButtonText}>
              {generatingRecipe ? 'Tarif Oluşturuluyor...' : 'Tarif Oluştur'}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
      
      {/* Custom Modal */}
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
    padding: 8,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'column',
    width: '48%',
    aspectRatio: 1,
  },
  recipeContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 4,
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
  },
  closeButtonText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  itemChip: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  itemChipText: {
    fontSize: 14,
    color: '#333',
  },
  emptyItemsText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  generateButtonText: {
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
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  deleteButtonContainer: {
    padding: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconBackground: {
    backgroundColor: '#4285F4',
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default RecipesScreen; 