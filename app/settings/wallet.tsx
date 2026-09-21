import { View, Text, Image, Pressable, Alert } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Clipboard from "expo-clipboard";
import { openWebUrl } from "@/utils/links";

const WalletScreen = () => {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [showCopied, setShowCopied] = useState(false);
  const [showUserIdCopied, setShowUserIdCopied] = useState(false);

  const userWalletAddress = user?.wallet_address;
  const userId = user?.id;

  const copyAddress = async () => {
    if (userWalletAddress) {
      await Clipboard.setStringAsync(userWalletAddress);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } else {
        Alert.alert("Error", "No wallet address found to copy.");
    }
  };

  const copyUserId = async () => {
    if (userId) {
      await Clipboard.setStringAsync(userId);
      setShowUserIdCopied(true);
      setTimeout(() => setShowUserIdCopied(false), 2000);
    } else {
      Alert.alert("Error", "No User ID found to copy.");
    }
  };

  const handleOpenExplorer = async () => {
    if (!userWalletAddress) {
      Alert.alert("Error", "No wallet address available.");
      return;
    }
    await openWebUrl(`https://optimistic.etherscan.io/address/${userWalletAddress}`);
  };

  const handleViewAttestations = async () => {
    const scanUrlPrefix = process.env.EXPO_PUBLIC_NETWORK_SCAN;

    if (!scanUrlPrefix) {
      console.error("EXPO_PUBLIC_NETWORK_SCAN environment variable is not set.");
      Alert.alert("Configuration Error", "The network scan URL is not configured. Please contact support.");
      return;
    }

    if (!userWalletAddress) {
      Alert.alert("Error", "No wallet address available to view attestations.");
      return;
    }

    await openWebUrl(`${scanUrlPrefix}/address/${userWalletAddress}`);
  };

  return (
    <SafeAreaContent className="bg-white-sand flex-1 relative">
      <View className="flex-row items-center justify-start pb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center space-x-1"
        >
          <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
          <Text className="text-base font-dm-regular text-enaleia-black tracking-tight">
            Settings
          </Text>
        </Pressable>
      </View>
      <View className="flex-1">
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4">
        Blockchain
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black tracking-tight mb-6">
         The following address & it's public key will be used to attest data to the Ethereum Attestation Services, on Optimism, a layer-2 blockchain on Ethereum.
        </Text>
        <View className="p-4 bg-white rounded-2xl border border-grey-3 mb-6">
          <View>
            <Text className="text-grey-6 text-sm font-bold  mb-1">
              Public Key
            </Text>
            <Pressable
              onPress={copyAddress}
              className="flex-row items-start justify-between"
            >
              <Text className="flex-1 text-enaleia-black text-lg font-dm-bold leading-snug mr-4">
                {userWalletAddress || "No wallet found"}
              </Text>
              <View className="w-6 h-6 items-center justify-center">
                {showCopied ? (
                  <Ionicons name="checkmark" size={24} color="#0d0d0d" />
                ) : (
                  <Ionicons name="copy-outline" size={24} color="#0d0d0d" />
                )}
              </View>
            </Pressable>
          </View>
        </View>
        <View className="gap-4">
          <Pressable
              onPress={handleViewAttestations}
              className="p-4 rounded-full border border-grey-3 flex-row justify-center items-center">
             <Text className="text-enaleia-black text-center font-dm-bold mr-2">
               View all my attestations
             </Text>
             <Ionicons name="open-outline" size={16} color="#0D0D0D" />
          </Pressable>
          {userWalletAddress ? (
            <Pressable
              onPress={handleOpenExplorer}
              className="p-4 rounded-full border border-grey-3 flex-row justify-center items-center">
               <Text className="text-enaleia-black text-center font-dm-bold mr-2">
                 View my address on block explorer
               </Text>
               <Ionicons name="open-outline" size={16} color="#0D0D0D" />
            </Pressable>
           ) : (
             <View className="p-4 rounded-full border border-grey-3 flex-row justify-center items-center bg-gray-100 opacity-60">
                <Text className="text-enaleia-black text-center font-dm-bold mr-2">
                  View wallet on block explorer
                </Text>
                <Ionicons name="open-outline" size={16} color="#0D0D0D" />
             </View>
           )}
        </View>
      </View>

      <View className="absolute bottom-3 left-0 right-0 items-center pointer-events-none">
          <Image
            source={require("@/assets/images/animals/JellyFish.png")}
            className="w-full h-auto max-w-[241px] max-h-[172px]"
            resizeMode="contain"
            accessibilityLabel="Decorative wallet illustration"
          />
      </View>
    </SafeAreaContent>
  );
};

export default WalletScreen;
