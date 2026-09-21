import LoginForm from "@/components/features/auth/LoginForm";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Pressable, Text, View } from "react-native";
import { AnimatePresence, MotiText } from "moti";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { openWebUrl } from "@/utils/links";

const KEYBOARD_OFFSET = Platform.OS === "ios" ? 0 : 500;
const KEYBOARD_BEHAVIOR = Platform.OS === "ios" ? "padding" : "height";

export default function LoginScreen() {
  return (
    <SafeAreaContent>
      <View className="absolute top-36 right-[-30px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[280px] h-[280px]"
          accessibilityLabel="Decorative turtle illustration"
          accessibilityRole="image"
        />
      </View>
      <KeyboardAvoidingView
        behavior={KEYBOARD_BEHAVIOR}
        keyboardVerticalOffset={KEYBOARD_OFFSET}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 0.8,
            justifyContent: "space-between",
          }}
        >
          <View className="mb-8 relative">
            <Image
              source={require("@/assets/images/logo-gray.webp")}
              className="w-[86px] h-[89px] rounded-full"
              accessibilityLabel="Enaleia Hub logo"
              accessibilityRole="image"
            />
          </View>
          <View className="">
            <AnimatePresence presenceAffectsLayout>
              <MotiText
                className="text-3xl font-dm-bold"
                style={{ letterSpacing: -1, lineHeight: 31.35008 }}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  delay: 200,
                }}
              >
                Welcome to Enaleia Hub
              </MotiText>
            </AnimatePresence>
            <Text className="text-base font-dm-light mb-3">
              Please sign in with the provided credential
            </Text>
            <LoginForm />
            <Text className="text-sm text-grey-8 font-dm-light mt-6 leading-[16.8px]">
              The Enaleia Hub is an invite-only application designed for
              ecosystem partners to securely submit data to the blockchain.
              Lost your login?{" "}
              <Pressable
                onPress={() => openWebUrl("mailto:app-support@enaleia.com,enaleia@pollenlabs.org")}
                accessibilityLabel="Email support"
                accessibilityRole="link"
              >
                <Text className="text-blue-ocean font-dm-bold underline">Contact support</Text>
              </Pressable>
              . Curious to learn more?{" "}
              <Pressable
                onPress={() => openWebUrl("https://enaleia-hub.com")}
                accessibilityLabel="Visit Enaleia-Hub.com"
                accessibilityRole="link"
              >
                <Text className="text-blue-ocean font-dm-bold underline">Visit Enaleia-Hub.com</Text>
              </Pressable>
              . A{" "}
              <Pressable
                onPress={() => openWebUrl("https://pollenlabs.org")}
                accessibilityLabel="Visit Pollen Labs"
                accessibilityRole="link"
              >
                <Text className="text-blue-ocean font-dm-bold underline">Pollen Labs </Text>
              </Pressable>
               creation.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaContent>
  );
}
