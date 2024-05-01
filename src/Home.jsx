import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  AsyncStorage,
  Dimensions,
  ScrollView
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import firebase from 'react-native-firebase';
import uuid from 'uuid/v4'; 

const options = {
  title: 'Select Image',
  storageOptions: {
    skipBackup: true,
    path: 'images'
  }
};
const ImageRow = ({ image, windowWidth, popImage }) => (
  <View>
    <Image
      source={{ uri: image }}
      style={[styles.img, { width: windowWidth / 2 - 15 }]}
      onError={popImage}
    />
  </View>
);

const App = () => {
  const [imgSource, setImgSource] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('images')
      .then(data => {
        const parsedImages = JSON.parse(data) || [];
        setImages(parsedImages);
      })
      .catch(error => {
        console.log(error);
      });
  }, []);

  const pickImage = () => {
    ImagePicker.showImagePicker(options, response => {
      if (response.didCancel) {
        console.log('You cancelled image picker 😟');
      } else if (response.error) {
        alert('And error occured: ', response.error);
      } else {
        const source = { uri: response.uri };
        setImgSource(source);
      }
    });
  };

  const uploadImage = () => {
    const ext = imgSource.uri.split('.').pop(); 
    const filename = `${uuid()}.${ext}`; 
    setUploading(true);
    firebase
      .storage()
      .ref(`tutorials/images/${filename}`)
      .putFile(imgSource.uri)
      .on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        snapshot => {
          const newProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(newProgress);
          if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
            const allImages = [...images, snapshot.downloadURL];
            setImages(allImages);
            AsyncStorage.setItem('images', JSON.stringify(allImages));
            setUploading(false);
            setImgSource('');
            setProgress(0);
          }
        },
        error => {
          alert('Sorry, Try again.');
          setUploading(false);
        }
      );
  };

  const removeImage = imageIndex => {
    const updatedImages = [...images];
    updatedImages.splice(imageIndex, 1);
    setImages(updatedImages);
    AsyncStorage.setItem('images', JSON.stringify(updatedImages));
  };

  const windowWidth = Dimensions.get('window').width;
  const disabledStyle = uploading ? styles.disabledBtn : {};
  const actionBtnStyles = [styles.btn, disabledStyle];

  return (
    <View>
      <ScrollView>
        <View style={styles.container}>
          <TouchableOpacity
            style={actionBtnStyles}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.btnTxt}>Pick image</Text>
          </TouchableOpacity>
          {imgSource !== '' && (
            <View>
              <Image source={imgSource} style={styles.image} />
              {uploading && (
                <View
                  style={[styles.progressBar, { width: `${progress}%` }]}
                />
              )}
              <TouchableOpacity
                style={actionBtnStyles}
                onPress={uploadImage}
                disabled={uploading}
              >
                <View>
                  {uploading ? (
                    <Text style={styles.btnTxt}>Uploading ...</Text>
                  ) : (
                    <Text style={styles.btnTxt}>Upload image</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View>
            <Text
              style={{
                fontWeight: '600',
                paddingTop: 20,
                alignSelf: 'center'
              }}
            >
              {images.length > 0
                ? 'Your uploaded images'
                : 'There is no image you uploaded'}
            </Text>
          </View>
          <FlatList
            numColumns={2}
            style={{ marginTop: 20 }}
            data={images}
            renderItem={({ item: image, index }) => (
              <ImageRow
                windowWidth={windowWidth}
                image={image}
                popImage={() => removeImage(index)}
              />
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingLeft: 5,
    paddingRight: 5
  },
  btn: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    backgroundColor: 'rgb(3, 154, 229)',
    marginTop: 20,
    alignItems: 'center'
  },
  disabledBtn: {
    backgroundColor: 'rgba(3,155,229,0.5)'
  },
  btnTxt: {
    color: '#fff'
  },
  image: {
    marginTop: 20,
    minWidth: 200,
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#ccc',
  },
  img: {
    flex: 1,
    height: 100,
    margin: 5,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#ccc'
  },
  progressBar: {
    backgroundColor: 'rgb(3, 154, 229)',
    height: 3,
    shadowColor: '#000',
  }
});

export default App;
