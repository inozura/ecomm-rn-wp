/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";

// vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import { useStateValue } from "../StateProvider";
import FavoritesFlatList from "../components/FavoritesFlatList";
import AppButton from "../components/AppButton";
import { COLORS } from "../variables/color";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import FlashNotification from "../components/FlashNotification";
import LoadingIndicator from "../components/LoadingIndicator";
import { paginationData } from "../app/pagination/paginationData";
import { __ } from "../language/stringPicker";

const favoritesScreenTexts = {
  removePromptMessage: "Do You want to remove this ad from your favorites?",
  cancelButtonTitle: "Cancel",
  removeButtonTitle: "Remove",
  noFavoriteMessage: "Currently you don't have any favorite ad!",
  postAdButtonTitle: "Post an ad now!",
  loadingMessage: "Getting favorite listings",

  favRemoveSuccessMessage: "Successfully removed",
  favRemoveErrorCustomMessage: "Error! Please try again",
  customServerResponseError: "Error getting data from server",
  noInternet: "No Internet",
};

const FavoritesScreen = ({ navigation }) => {
  const [{ auth_token, is_connected, appSettings }, dispatch] = useStateValue();

  const [myFavs, setMyFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(
    pagination.current_page || paginationData.favourites.page
  );
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  // Initial get listing call
  useEffect(() => {
    if (!initial) return;
    handleLoadFavsList(paginationData.favourites);
    setInitial(false);
  }, [initial]);

  // Refresh get listing call
  useEffect(() => {
    if (!refreshing) return;
    setCurrentPage((prevCurrentPage) => 1);
    setPagination({});
    handleLoadFavsList(paginationData.favourites);
  }, [refreshing]);

  // next page get listing call
  useEffect(() => {
    if (!moreLoading) return;
    const data = {
      per_page: paginationData.favourites.per_page,
      page: currentPage,
    };
    handleLoadFavsList(data);
  }, [moreLoading]);

  const handleLoadFavsList = (data) => {
    setAuthToken(auth_token);
    api.get("my/favourites", data).then((res) => {
      if (res.ok) {
        if (refreshing) {
          setRefreshing((prevRefreshing) => false);
        }
        if (moreLoading) {
          setMyFavs((prevMyFavs) => [...prevMyFavs, ...res.data.data]);
          setMoreLoading((prevMoreLoading) => false);
        } else {
          setMyFavs((prevMyFavs) => res.data.data);
        }
        setPagination(res?.data?.pagination || {});

        removeAuthToken();
        if (loading) {
          setLoading((loading) => false);
        }
      } else {
        if (refreshing) {
          setRefreshing((prevRefreshing) => false);
        }
        if (moreLoading) {
          setMoreLoading((prevMoreLoading) => false);
        }
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __(
              "favoritesScreenTexts.customServerResponseError",
              appSettings.lng
            )
        );
        if (loading) {
          setLoading((loading) => false);
        }
        removeAuthToken();
      }
    });
  };

  const handleRemoveFavAlert = (listing) => {
    Alert.alert(
      "",
      __("favoritesScreenTexts.removePromptMessage", appSettings.lng),
      [
        {
          text: __("favoritesScreenTexts.cancelButtonTitle", appSettings.lng),

          style: "cancel",
        },
        {
          text: __("favoritesScreenTexts.removeButtonTitle", appSettings.lng),
          onPress: () => handleRemoveFromFavorites(listing),
        },
      ],
      { cancelable: false }
    );
  };
  const handleRemoveFromFavorites = (listing) => {
    setDeleteLoading((deleteLoading) => true);
    setAuthToken(auth_token);
    api
      .post("my/favourites", { listing_id: listing.listing_id })
      .then((res) => {
        if (res.ok) {
          setMyFavs(myFavs.filter((fav) => fav != listing));
          removeAuthToken();
          setDeleteLoading((deleteLoading) => false);
          handleSuccess(
            __("favoritesScreenTexts.favRemoveSuccessMessage", appSettings.lng)
          );
        } else {
          setErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "favoritesScreenTexts.favRemoveErrorCustomMessage",
                appSettings.lng
              )
          );
          removeAuthToken();
          setDeleteLoading((deleteLoading) => false);
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "favoritesScreenTexts.favRemoveErrorCustomMessage",
                appSettings.lng
              )
          );
        }
      });
  };

  const handleNewListing = () => {
    navigation.navigate("New Listing");
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: true,
    });
  };

  const renderFavsItem = ({ item }) => (
    <FavoritesFlatList
      item={item}
      onDelete={() => handleRemoveFavAlert(item)}
      onClick={() => handleViewListing(item)}
    />
  );

  const handleViewListing = (item) => {
    navigation.navigate("Listing Detail", {
      listingId: item.listing_id,
    });
  };

  const keyExtractor = useCallback((item, index) => `${index}`, []);

  const listFooter = () => {
    if (pagination && pagination.total_pages > pagination.current_page) {
      return (
        <View style={styles.loadMoreWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    } else {
      return null;
    }
  };

  const onRefresh = () => {
    if (moreLoading) return;
    setRefreshing((prevRefreshing) => true);
  };

  const handleNextPageLoading = () => {
    if (refreshing) return;
    if (pagination && pagination.total_pages > pagination.current_page) {
      setCurrentPage((prevCurrentPage) => prevCurrentPage + 1);
      setMoreLoading(true);
    }
  };

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1000);
  };
  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1200);
  };

  return is_connected ? (
    <>
      {loading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingMessage}>
              {__("favoritesScreenTexts.loadingMessage", appSettings.lng)}
            </Text>
          </View>
        </View>
      ) : (
        <>
          {!!deleteLoading && (
            <View style={styles.deleteLoading}>
              <View style={styles.deleteLoadingContentWrap}>
                <LoadingIndicator
                  visible={true}
                  style={{
                    width: "100%",
                    marginLeft: "3.125%",
                  }}
                />
              </View>
            </View>
          )}

          {!!myFavs.length && (
            <View
              style={{
                backgroundColor: COLORS.white,
                flex: 1,
                paddingVertical: 5,
                paddingHorizontal: "3%",
              }}
            >
              <FlatList
                data={myFavs}
                renderItem={renderFavsItem}
                keyExtractor={keyExtractor}
                horizontal={false}
                // showsVerticalScrollIndicator={false}
                onEndReached={handleNextPageLoading}
                onEndReachedThreshold={0.2}
                ListFooterComponent={listFooter}
                // maxToRenderPerBatch={14}
                onRefresh={onRefresh}
                refreshing={refreshing}
              />
            </View>
          )}
          {!myFavs.length && (
            <View style={styles.noFavWrap}>
              <FontAwesome
                name="exclamation-triangle"
                size={100}
                color={COLORS.gray}
              />
              <Text style={styles.noFavTitle}>
                {__("favoritesScreenTexts.noFavoriteMessage", appSettings.lng)}
              </Text>
              <AppButton
                title={__(
                  "favoritesScreenTexts.postAdButtonTitle",
                  appSettings.lng
                )}
                style={styles.postButton}
                onPress={handleNewListing}
              />
            </View>
          )}
          <FlashNotification
            falshShow={flashNotification}
            flashMessage={flashNotificationMessage}
          />
        </>
      )}
    </>
  ) : (
    <View style={styles.noInternet}>
      <FontAwesome5
        name="exclamation-circle"
        size={24}
        color={COLORS.primary}
      />
      <Text style={styles.text}>
        {__("favoritesScreenTexts.noInternet", appSettings.lng)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  containerNoFavs: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  deleteLoading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "rgba(255,255,255,.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
    height: "100%",
    width: "100%",
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },
  loadingWrap: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  noFavTitle: {
    fontSize: 18,
    color: COLORS.text_gray,
    marginTop: 10,
  },
  noFavWrap: {
    alignItems: "center",
    marginHorizontal: "3%",
    flex: 1,
    justifyContent: "center",
  },
  noInternet: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  postButton: {
    borderRadius: 3,
    marginTop: 40,
    width: "60%",
  },
});

export default FavoritesScreen;
