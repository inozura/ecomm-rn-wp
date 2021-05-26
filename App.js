import React from "react";
import { LogBox } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

// Custom Components
import Screen from "./components/Screen";
import HomeNavigator from "./navigation/HomeNavigator";
import { StateProvider } from "./StateProvider";
import reducer, { initialState } from "./reducer";

const App = () => {
  // TODO: This is a workaround of some ios warning about lottieview pause and resume
  LogBox.ignoreLogs(["ReactNative.NativeModules.LottieAnimationView"]);
  return (
    <StateProvider initialState={initialState} reducer={reducer}>
      <Screen>
        <NavigationContainer>
          <HomeNavigator />
        </NavigationContainer>
      </Screen>
    </StateProvider>
  );
};

export default App;
