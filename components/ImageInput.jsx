import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  Alert,
  TouchableOpacity,
  Modal,
  Text,
  Dimensions,
} from "react-native";

// Expo Libraries
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";

// Custom Component & Variables
import { COLORS } from "../variables/color";
import AppTextButton from "./AppTextButton";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const { width: deviceWidth } = Dimensions.get("screen");

const imageInputTexts = {
  cancelButtonTitle: "Cancel",
};

const ImageInput = ({
  imageUri,
  onChangeImage,
  drag,
  active,
  addingImage,
  closePhotoModal,
  display,
}) => {
  const [{ appSettings }] = useStateValue();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!addingImage) {
      return;
    }
    setModalVisible(true);
  }, [addingImage]);

  const requestGalleryParmission = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted)
      alert("You need to enable permission to access image library ");
    else handleSelectGalleryImage();
  };
  const requestCameraParmission = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) alert("You need to enable permission to access your camera ");
    else handleSelectCameraImage();
  };
  const handleSelectGalleryImage = async () => {
    // if (Platform.OS === "android") {
    //   setModalVisible((preVodalVisible) => !preVodalVisible);
    // }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        // if (Platform.OS === "ios") {
        setModalVisible((preVodalVisible) => !preVodalVisible);
        // }
        onChangeImage(result.uri);
      }
    } catch (error) {
      // TODO add error storing
      setModalVisible((modalVisible) => !modalVisible);
    }
  };
  const handleSelectCameraImage = async () => {
    // if (Platform.OS === "android") {
    //   setModalVisible((prevModalVisible) => !prevModalVisible);
    // }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      });
      if (!result.cancelled) {
        // if (Platform.OS === "ios") {
        setModalVisible((prevModalVisible) => !prevModalVisible);
        // }
        onChangeImage(result.uri);
      }
    } catch (error) {
      // TODO add error storing
      setModalVisible((modalVisible) => !modalVisible);
    }
  };
  const handleDelete = () => {
    Alert.alert("Delete", "Do you really want to remove this image?", [
      { text: "No" },
      { text: "Yes", onPress: () => onChangeImage(null) },
    ]);
  };
  const handlePress = () => {
    if (!imageUri) setModalVisible((modalVisible) => !modalVisible);
  };
  return (
    <>
      <TouchableWithoutFeedback onPress={handlePress} onLongPress={drag}>
        <View
          style={[styles.container, { display: display ? "flex" : "none" }]}
        >
          {active && <View style={styles.activeOverlay} />}
          {!imageUri && (
            <FontAwesome name="camera" size={30} color={COLORS.text_gray} />
          )}
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}
        </View>
      </TouchableWithoutFeedback>
      {imageUri && (
        <TouchableOpacity style={styles.deleteImgWrap} onPress={handleDelete}>
          <View
            style={{ height: 3, width: 10, backgroundColor: COLORS.white }}
          />
        </TouchableOpacity>
      )}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback
          onPress={() => {
            setModalVisible((modalVisible) => !modalVisible);
            closePhotoModal();
          }}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.modalTitle}>Add Photo</Text>
            </View>
            <View style={styles.contentWrap}>
              <TouchableOpacity
                style={styles.libraryWrap}
                onPress={() => requestCameraParmission()}
              >
                <FontAwesome
                  name="camera-retro"
                  size={40}
                  color={COLORS.primary}
                />
                <Text style={styles.libraryText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.libraryWrap}
                onPress={() => requestGalleryParmission()}
              >
                <Ionicons name="md-images" size={40} color={COLORS.primary} />
                <Text style={styles.libraryText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
            <AppTextButton
              style={styles.cancelButton}
              title={__("imageInputTexts.cancelButtonTitle", appSettings.lng)}
              onPress={() => {
                setModalVisible((modalVisible) => !modalVisible);
                closePhotoModal();
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  activeOverlay: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.bg_primary,
    opacity: 0.3,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 6,
  },
  cancelButton: {
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    height: deviceWidth * 0.2,
    width: deviceWidth * 0.2,
    marginRight: deviceWidth * 0.04,
  },
  contentWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteImgWrap: {
    position: "absolute",
    height: 18,
    width: 18,
    borderRadius: 9,
    top: "20%",
    right: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.red,
  },
  image: {
    height: "100%",
    width: "100%",
  },
  libraryText: {
    fontSize: 16,
    color: COLORS.text_gray,
    marginVertical: 10,
  },
  libraryWrap: {
    alignItems: "center",
    marginHorizontal: 15,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginBottom: 25,
  },
  modalView: {
    // margin: 20,
    backgroundColor: "white",
    borderRadius: 5,
    paddingVertical: 30,
    paddingHorizontal: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ImageInput;
