import { View, Text, Image, Pressable, Platform, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView } from "moti";
import SignOutModal from "@/components/features/auth/SignOutModal";
import { useAuth } from "@/contexts/AuthContext";
import { useDevMode } from "@/contexts/DevModeContext";
import Constants from "expo-constants";
import { openWebUrl } from "@/utils/links";

// Define types for helper components
interface SettingsListItemProps {
  children: React.ReactNode;
  isFirst?: boolean; // Optional as default is false
  isLast?: boolean; // Optional as default is false
  onPress: () => void;
  // Allow other Pressable props
  [x: string]: any;
}

interface CategoryHeaderProps {
  title: string;
  viewClassName?: string; // Optional class for the outer View
  textClassName?: string; // Optional class for the Text element
}

const SettingsScreen = () => {
  const { showTimers } = useDevMode();
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const { user, logout } = useAuth();
  const { toggleDevMode } = useDevMode();
  const [tapCount, setTapCount] = useState(0);

  const version = Constants.expoConfig?.version ?? "0.0.0";
  const buildNumber = Platform.select({
    ios: Constants.expoConfig?.extra?.eas?.buildNumber ?? "1",
    android: Constants.expoConfig?.extra?.eas?.buildNumber ?? "1",
    default: "1",
  });

  const openGuides = async () => {
    await openWebUrl("https://sites.google.com/pollenlabs.org/enaleiahub-guides/mobile-app/mobile-app-overview");
  };

  const contactSupport = async () => {
    await openWebUrl("mailto:app-support@enaleia.com,enaleia@pollenlabs.org?subject=Support%20Request&body=Describe%20your%20issue%20here...");
  };

  const handleBackgroundTap = () => {
    setTapCount(prev => prev + 1);
  };

  // Reset tap count after 3 seconds of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (tapCount > 0) {
      timeoutId = setTimeout(() => {
        setTapCount(0);
      }, 3000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [tapCount]);

  // Handle dev mode toggle when tap count reaches 10
  useEffect(() => {
    if (tapCount === 10) {
      toggleDevMode();
      setTapCount(0);
    }
  }, [tapCount, toggleDevMode]);

  // Helper component for list items to manage borders correctly
  const SettingsListItem: React.FC<SettingsListItemProps> = ({ children, isFirst = false, isLast = false, onPress, ...props }) => (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 bg-white ${!isLast ? 'border-b border-grey-3' : ''}`}
      {...props}
    >
      {children}
    </Pressable>
  );
  
  // Helper component for category headers - updated to accept classNames
  const CategoryHeader: React.FC<CategoryHeaderProps> = ({ title, viewClassName, textClassName }) => (
    <View className={`mt-6 mb-2 ${viewClassName || ''}`}> 
       <Text className={`text-base font-dm-bold text-grey-9 ${textClassName || ''}`}>{title}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-sand-beige">
      <SafeAreaContent>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable 
            onPress={handleBackgroundTap}
            className="flex-1"
          >
            <View className="mt-2">
              <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
                Settings
              </Text>
            </View>

          {/* General Section */}
          <CategoryHeader title="General" />
          <View className="rounded-2xl overflow-hidden border border-grey-3">
             <SettingsListItem onPress={() => router.push("/settings/account-attestation")} isFirst={true}>
               <View className="flex-row items-center gap-2">
                 <Ionicons name="person-circle-outline" size={24} color="#0D0D0D" />
                 <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                   Account
                 </Text>
               </View>
               <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
             </SettingsListItem>
             <SettingsListItem onPress={() => router.push("/settings/wallet")}>
               <View className="flex-row items-center gap-2">
                 <Ionicons name="key-outline" size={24} color="#0D0D0D" />
                 <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                    Blockchain
                 </Text>
               </View>
               <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
             </SettingsListItem>
             <SettingsListItem onPress={() => router.push("/settings/preferences")} isLast={true}>
               <View className="flex-row items-center gap-2">
                 <Ionicons name="options-outline" size={24} color="#0D0D0D" />
                 <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                   Preferences
                 </Text>
               </View>
               <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
             </SettingsListItem>
          </View>

          {/* Support Section */}
          <CategoryHeader title="Support" />
           <View className="rounded-2xl overflow-hidden border border-grey-3">
              <SettingsListItem onPress={openGuides} isFirst={true}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="book-outline" size={24} color="#0D0D0D" />
                  <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                    Guides
                  </Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#0D0D0D" />
              </SettingsListItem>
              <SettingsListItem onPress={contactSupport} isLast={true}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="#0D0D0D" />
                  <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                    Send feedback
                  </Text>
                </View>
                <Ionicons name="mail-open-outline" size={16} color="#0D0D0D" />
              </SettingsListItem>
           </View>


          {/* Dev Only Section */}
          {showTimers && (
            <>
              <CategoryHeader title="Dev only" />
               <View className="rounded-2xl overflow-hidden border border-grey-3">
                 <SettingsListItem onPress={() => router.push("/settings/queue-test")} isFirst={true} isLast={true}>
                   <View className="flex-row items-center gap-2">
                     <Ionicons name="bug-outline" size={24} color="#0D0D0D" />
                     <Text className="text-base font-dm-bold text-slate-800 tracking-tighter">
                       Queue Testing
                     </Text>
                   </View>
                   <Ionicons name="chevron-forward-outline" size={16} color="#0D0D0D" />
                 </SettingsListItem>
               </View>
            </>
          )}
          
          {/* Sign Out Section */}
           <CategoryHeader title="Session" />
           <View className="mt-0 mb-6 rounded-2xl overflow-hidden border border-grey-3">
              <SettingsListItem onPress={() => setIsSignOutModalVisible(true)} isFirst={true} isLast={true}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                  <Text className="text-base font-dm-bold text-rose-600 tracking-tighter">
                    Sign Out
                  </Text>
                </View>
              </SettingsListItem>
           </View>



            <View className="mt-10 items-end opacity-100 left-[10px]">
              <Image
                source={require("@/assets/images/animals/TurtleCollab.png")}
                className="w-[390px] h-[198px]"
                accessibilityLabel="Decorative turtle illustration"
                accessibilityRole="image"
              />
            </View>

            <View className="items-center mt-2 mb-4 px-4">
            <Text className="text-sm font-dm-regular text-gray-500">
              Version {version}  - Mainnet / Optimism
            </Text>
          </View>

            {/* <View className="items-center mt-8 px-4">
              <Text className="text-sm font-dm-regular text-gray-500">
                Version {version} ({buildNumber})
              </Text>
            </View> */}
          </Pressable>
        </ScrollView>
      </SafeAreaContent>
      <SignOutModal
        isVisible={isSignOutModalVisible}
        onClose={() => setIsSignOutModalVisible(false)}
      />
    </View>
  );
};

export default SettingsScreen;
