import { View, Text, Pressable, Image, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

interface DataItemProps {
  label: string;
  value: string | null | undefined;
  helpText?: string;
}

const DataItem: React.FC<DataItemProps> = ({ label, value, helpText }) => (
  <View className="self-stretch flex flex-col justify-start items-start gap-1">
    <Text className="text-grey-6 text-sm font-dm-bold">{label}</Text>
    <Text className="self-stretch text-enaleia-black text-lg font-dm-bold">
      {value || "N/A"}
    </Text>
    {helpText && (
      <Text className="text-grey-6 text-xs font-dm-regular mt-0.5">{helpText}</Text>
    )}
  </View>
);

// Function to obscure email
const obscureEmail = (email: string | null | undefined): string => {
  if (!email || !email.includes('@')) {
    return "N/A";
  }
  const [localPart, domain] = email.split('@');
  const [domainName, ...tlds] = domain.split('.');
  const tld = tlds.join('.'); // Handle multi-part TLDs like .co.uk

  if (!localPart || !domainName || !tld) {
     return "N/A"; // Invalid format
  }

  const obscuredLocal = localPart.length > 2 ? localPart.substring(0, 2) + '****' : '****';
  const obscuredDomainName = '***';

  return `${obscuredLocal}@${obscuredDomainName}.${tld}`;
};

const AccountAttestationScreen = () => {
  const { user, refreshUserProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserProfile();
    setIsRefreshing(false);
  };

  const getCompanyName = (): string | null => {
    if (!user?.Company) return null;
    if (typeof user.Company === "object" && "name" in user.Company) {
      return user.Company.name ?? null;
    }
    return null;
  };

  const getAssignedCountries = (): string => {
    if (!user?.Country_assign?.length) return "N/A";
    return user.Country_assign.map((c) => c.countries_country_id.country_name).join(", ");
  };

  // Format User ID to remove hyphens
  const formattedUserId = user?.id

  return (
    <SafeAreaContent>
        <View className="flex-row items-center justify-between pb-4">
            <Pressable
              onPress={() => router.back()}
              className="flex-row items-center space-x-1"
            >
              <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
              <Text className="text-base font-dm-regular text-enaleia-black tracking-tight">
                Settings
              </Text>
            </Pressable>
            <Pressable onPress={handleRefresh} disabled={isRefreshing} className="p-1">
              {isRefreshing
                ? <ActivityIndicator size="small" color="#0D0D0D" />
                : <Ionicons name="refresh-outline" size={22} color="#0D0D0D" />
              }
            </Pressable>
          </View>
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4">
          Account
        </Text>
        <Text className="text-base font-dm-regular text-enaleia-black mb-6">
          Your personal information and affiliations
        </Text>

        <View className="flex-1">
          {/* Personal info */}
          <View className="bg-white rounded-2xl border border-grey-3 mb-6">
            <View className="p-4 w-full border-b border-grey-3">
              <DataItem label="First name" value={user?.first_name} />
            </View>
            <View className="p-4 w-full border-b border-grey-3">
              <DataItem label="Email" value={obscureEmail(user?.email)} />
            </View>
            <View className="p-4 w-full">
              <DataItem label="User ID" value={formattedUserId} />
            </View>
          </View>

          {/* Affiliation */}
          <Text className="text-xl font-dm-bold text-enaleia-black mb-1">
            Affiliation
          </Text>
          <Text className="text-sm font-dm-regular text-grey-6 mb-3">
            The company or port this account is associated with
          </Text>
          <View className="bg-white rounded-2xl border border-grey-3">
            <View className="p-4 w-full border-b border-grey-3">
              <DataItem label="Company name" value={getCompanyName()} />
            </View>
            <View className="p-4 w-full">
              <DataItem
                label="Assigned countries"
                value={getAssignedCountries()}
                helpText="This is for port coordinators who may be assigned to specific countries."
              />
            </View>
          </View>
        </View>

        {/* Restore Absolutely positioned image container */}
        <View className="absolute bottom-1 right-0 pointer-events-none z-[-1]">
            <Image
               source={require("@/assets/images/Coast.png")} 
               className="max-w-[353px] max-h-[234px]" 
               resizeMode="contain"
               accessibilityLabel="Decorative account illustration"
            />
        </View>
    </SafeAreaContent>
  );
};

export default AccountAttestationScreen; 