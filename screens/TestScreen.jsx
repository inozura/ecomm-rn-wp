import React from "react";
import {
  Button,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const TestScreen = (props) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
    >
      <ScrollView
        contentContainerStyle={
          {
            // paddingBottom: Platform.OS === "ios" ? 0 : 50,
          }
        }
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>1</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>2</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>10</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>9</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>8</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>7</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>6</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>5</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>4</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>3</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>2</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            backgroundColor: "yollow",
            borderWidth: 1,
            borderColor: "red",
            marginVertical: 10,
          }}
        >
          <Text>1</Text>
          <TextInput
            style={{
              height: 40,
              borderColor: "#000000",
              borderBottomWidth: 1,
              marginBottom: 36,
              width: "50%",
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default TestScreen;
