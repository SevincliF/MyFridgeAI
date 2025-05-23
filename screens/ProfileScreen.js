import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Platform
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomModal from '../components/CustomModal';
import useModal from '../hooks/useModal';

// Diyet tercihleri
const DIET_PREFERENCES = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vejetaryen' },
  { id: 'glutenFree', label: 'Gluten Free' },
  { id: 'dairyFree', label: 'Süt Ürünleri İçermez' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
  { id: 'lowCarb', label: 'Düşük Karbonhidrat' }
];

// Yaygın alerjiler
const COMMON_ALLERGIES = [
  { id: 'peanuts', label: 'Yer Fıstığı' },
  { id: 'shellfish', label: 'Deniz Ürünleri' },
  { id: 'dairy', label: 'Süt Ürünleri' },
  { id: 'eggs', label: 'Yumurta' },
  { id: 'soy', label: 'Soya' },
  { id: 'wheat', label: 'Buğday' },
  { id: 'treeNuts', label: 'Kuruyemişler' },
  { id: 'fish', label: 'Balık' }
];

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    displayName: '',
    dietPreferences: [],
    allergies: [],
    otherAllergies: ''
  });
  
  // Modal hook
  const { visible, modalConfig, showModal, hideModal, showSuccess, showError, showConfirm } = useModal();
  
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email || '';
  const insets = useSafeAreaInsets();
  
  // Firebase oturumu kontrol et
  useEffect(() => {
    if (!auth.currentUser) {
      console.log('Kullanıcı oturumu bulunamadı');
      setLoading(false);
    }
  }, [auth]);
  
  // Kullanıcı profilini getir
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (userDoc.exists) {
        const userDocData = userDoc.data() || {};
        setUserData({
          displayName: userDocData.displayName || auth.currentUser?.displayName || '',
          dietPreferences: userDocData.dietPreferences || [],
          allergies: userDocData.allergies || [],
          otherAllergies: userDocData.otherAllergies || ''
        });
      } else {
        // Kullanıcı dokümanı yoksa, varsa auth'dan displayName'i al
        setUserData({
          displayName: auth.currentUser?.displayName || '',
          dietPreferences: [],
          allergies: [],
          otherAllergies: ''
        });
      }
    } catch (error) {
      console.error('Kullanıcı profili alınırken hata:', error);
      // Hata durumunda doğrudan state'i düzenliyoruz, modal gösterimi dışarıdan yönetilecek
      setUserData({
        displayName: '',
        dietPreferences: [],
        allergies: [],
        otherAllergies: ''
      });
    } finally {
      setLoading(false);
    }
  }, [userId, auth.currentUser]);

  useEffect(() => {
    if (userId) {
      fetchUserProfile().catch(error => {
        // Hata durumunda burada modal gösteriyoruz
        showError('Hata', 'Profil bilgileri yüklenirken bir sorun oluştu.');
      });
    }
  }, [fetchUserProfile, userId, showError]);

  // Profil değişikliklerini kaydet
  const handleSaveProfile = async () => {
    if (!userId) return;
    
    setSaving(true);
    
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .set({
          displayName: userData.displayName,
          dietPreferences: userData.dietPreferences,
          allergies: userData.allergies,
          otherAllergies: userData.otherAllergies,
          email: userEmail,
          updatedAt: firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      
      showSuccess('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (error) {
      console.error('Profil güncellenirken hata:', error);
      showError('Hata', 'Profil bilgileri kaydedilirken bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Çıkış yap
  const handleSignOut = async () => {
    showConfirm(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      async () => {
        try {
          await signOut(auth);
          // Çıkış başarılı - auth durumu değişecek ve App.tsx'teki kontroller sayesinde Login sayfasına yönlendirilecek
        } catch (error) {
          console.error('Çıkış yapılırken hata oluştu:', error);
          showError('Hata', 'Çıkış yapılırken bir sorun oluştu.');
        }
      }
    );
  };

  // Diyet tercihini değiştir
  const toggleDietPreference = (preferenceId) => {
    setUserData(prevData => {
      const isSelected = prevData.dietPreferences.includes(preferenceId);
      
      if (isSelected) {
        // Kaldır
        return {
          ...prevData,
          dietPreferences: prevData.dietPreferences.filter(id => id !== preferenceId)
        };
      } else {
        // Ekle
        return {
          ...prevData,
          dietPreferences: [...prevData.dietPreferences, preferenceId]
        };
      }
    });
  };

  // Alerji tercihini değiştir
  const toggleAllergy = (allergyId) => {
    setUserData(prevData => {
      const isSelected = prevData.allergies.includes(allergyId);
      
      if (isSelected) {
        // Kaldır
        return {
          ...prevData,
          allergies: prevData.allergies.filter(id => id !== allergyId)
        };
      } else {
        // Ekle
        return {
          ...prevData,
          allergies: [...prevData.allergies, allergyId]
        };
      }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' ? 60 + insets.bottom : 120
      }}>
        <Text style={styles.title}>Profilim</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <TextInput
              style={styles.input}
              value={userData.displayName}
              onChangeText={(text) => setUserData({ ...userData, displayName: text })}
              placeholder="Ad Soyad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={userEmail}
              editable={false}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diyet Tercihleri</Text>
          <Text style={styles.sectionDescription}>
            Tarif önerilerinde diyetinize uygun seçenekler sunulması için tercihlerinizi belirtin.
          </Text>
          
          {DIET_PREFERENCES.map((preference) => (
            <View key={preference.id} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>{preference.label}</Text>
              <Switch
                value={userData.dietPreferences.includes(preference.id)}
                onValueChange={() => toggleDietPreference(preference.id)}
                trackColor={{ false: '#e0e0e0', true: '#aed6f1' }}
                thumbColor={userData.dietPreferences.includes(preference.id) ? '#4285F4' : '#f5f5f5'}
              />
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerjilerim</Text>
          <Text style={styles.sectionDescription}>
            Sağlığınız için tarif önerilerinde dikkate alınacak alerjilerinizi belirtin.
          </Text>
          
          {COMMON_ALLERGIES.map((allergy) => (
            <View key={allergy.id} style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>{allergy.label}</Text>
              <Switch
                value={userData.allergies.includes(allergy.id)}
                onValueChange={() => toggleAllergy(allergy.id)}
                trackColor={{ false: '#e0e0e0', true: '#f5c6c6' }}
                thumbColor={userData.allergies.includes(allergy.id) ? '#db4437' : '#f5f5f5'}
              />
            </View>
          ))}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Diğer Alerjiler</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={userData.otherAllergies}
              onChangeText={(text) => setUserData({ ...userData, otherAllergies: text })}
              placeholder="Varsa diğer alerjilerinizi virgülle ayırarak yazın"
              multiline
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4285F4',
    marginVertical: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#ebebeb',
    color: '#888',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#db4437',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 0,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 