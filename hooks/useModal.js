import { useState, useCallback } from 'react';

const useModal = () => {
  const [visible, setVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    buttons: [{ text: 'Tamam', onPress: () => {}, style: 'default' }]
  });

  const showModal = useCallback((config) => {
    setModalConfig(config);
    setVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setVisible(false);
  }, []);

  // Alert fonksiyonlarını taklit eden yardımcı metodlar - useCallback ile sarmalıyoruz
  const showSuccess = useCallback((title, message, onPress = () => {}) => {
    showModal({
      title,
      message,
      buttons: [{ text: 'Tamam', onPress, style: 'default' }]
    });
  }, [showModal]);

  const showError = useCallback((title, message, onPress = () => {}) => {
    showModal({
      title,
      message,
      buttons: [{ text: 'Tamam', onPress, style: 'default' }]
    });
  }, [showModal]);

  const showConfirm = useCallback((title, message, onConfirm, onCancel = () => {}) => {
    showModal({
      title,
      message,
      buttons: [
        { text: 'İptal', onPress: onCancel, style: 'cancel' },
        { text: 'Evet', onPress: onConfirm, style: 'destructive' }
      ]
    });
  }, [showModal]);

  return {
    visible,
    modalConfig,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showConfirm
  };
};

export default useModal; 