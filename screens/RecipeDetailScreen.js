import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { 
  BottomSheetView, 
  BottomSheetBackdrop,
  BottomSheetTextInput
} from '@gorhom/bottom-sheet';
import firestore from '@react-native-firebase/firestore';
import CustomModal from '../components/CustomModal';
import useModal from '../hooks/useModal';

const RecipeDetailScreen = ({ route, navigation }) => {
  const { recipe } = route.params;
  const insets = useSafeAreaInsets();
  const [editedTitle, setEditedTitle] = useState(recipe.title);
  const [recipeTitle, setRecipeTitle] = useState(recipe.title);
  
  // Modal hook'unu kullan
  const { visible, modalConfig, showModal, hideModal, showSuccess, showError, showConfirm } = useModal();
  
  // BottomSheet için
  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['40%'], []);
  
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
  
  // Başlığı düzenlemek için BottomSheet'i aç
  const openEditTitleSheet = () => {
    setEditedTitle(recipe.title);
    bottomSheetRef.current?.expand();
  };
  
  // BottomSheet'i kapat
  const closeBottomSheet = () => {
    bottomSheetRef.current?.close();
  };
  
  // Başlığı güncelle
  const updateRecipeTitle = async () => {
    if (!editedTitle.trim()) {
      showError('Hata', 'Tarif başlığı boş olamaz');
      return;
    }
    
    try {
      await firestore()
        .collection('recipes')
        .doc(recipe.id)
        .update({
          title: editedTitle.trim()
        });
      
      // Tarif nesnesini güncelle (navigasyon için)
      recipe.title = editedTitle.trim();
      
      // Arayüzü güncellemek için state'i güncelle
      setRecipeTitle(editedTitle.trim());
      
      showSuccess('Başarılı', 'Tarif başlığı güncellendi');
      closeBottomSheet();
    } catch (error) {
      console.error('Tarif güncellenirken hata:', error);
      showError('Hata', 'Tarif güncellenirken bir sorun oluştu');
    }
  };
  
  // Tarifi sil
  const deleteRecipe = () => {
    showConfirm(
      'Tarifi Sil',
      'Bu tarifi silmek istediğinize emin misiniz?',
      async () => {
        try {
          await firestore()
            .collection('recipes')
            .doc(recipe.id)
            .delete();
          
          showSuccess('Başarılı', 'Tarif başarıyla silindi', () => {
            navigation.goBack();
          });
        } catch (error) {
          console.error('Tarif silinirken hata oluştu:', error);
          showError('Hata', 'Tarif silinirken bir sorun oluştu');
        }
      }
    );
  };
  
  // Ekranın başlık kısmını oluştur
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {recipeTitle}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={openEditTitleSheet}
      >
        <MaterialCommunityIcons name="pencil" size={22} color="#4285F4" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={deleteRecipe}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );
  
  // Tarif içeriğini render et
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.recipeIconContainer}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons name="chef-hat" size={64} color="#ffffff" />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Malzemeler</Text>
        <View style={styles.ingredientsContainer}>
          {Array.isArray(recipe.ingredients) && recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <MaterialCommunityIcons name="circle-small" size={24} color="#4285F4" />
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Tarif</Text>
        <Text style={styles.instructionText}>{recipe.instructions}</Text>
      </ScrollView>
      
      {/* Başlık Düzenleme BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableBackdropPress={true}
        backdropComponent={renderBackdrop}
        style={styles.bottomSheet}
      >
        <BottomSheetView style={styles.bottomSheetContainer}>
          <BottomSheetView style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Tarif Başlığını Düzenle</Text>
            <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>İptal</Text>
            </TouchableOpacity>
          </BottomSheetView>
          
          <BottomSheetTextInput
            style={styles.input}
            value={editedTitle}
            onChangeText={setEditedTitle}
            placeholder="Tarif başlığı giriniz"
            maxLength={50}
          />
          
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={updateRecipeTitle}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </BottomSheetView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#e4e8ed',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  recipeIconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  iconBackground: {
    backgroundColor: '#4285F4',
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 16,
  },
  ingredientsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ingredientText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  // BottomSheet Stilleri
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
    fontSize: 18,
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default RecipeDetailScreen; 