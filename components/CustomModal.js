import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

const CustomModal = ({ visible, title, message, buttons, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {title && <Text style={styles.title}>{title}</Text>}
              
              {message && <Text style={styles.message}>{message}</Text>}
              
              <View style={styles.buttonContainer}>
                {buttons?.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      styles[button.style] || styles.default,
                      // Eğer son buton ise, sağ margin olmasın
                      index === buttons.length - 1 ? null : { marginRight: 10 },
                    ]}
                    onPress={() => {
                      button.onPress?.();
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        styles[`${button.style}Text`] || styles.defaultText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  default: {
    backgroundColor: '#4285F4',
  },
  cancel: {
    backgroundColor: '#f5f5f5',
  },
  destructive: {
    backgroundColor: '#db4437',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  defaultText: {
    color: 'white',
  },
  cancelText: {
    color: '#333',
  },
  destructiveText: {
    color: 'white',
  },
});

export default CustomModal; 