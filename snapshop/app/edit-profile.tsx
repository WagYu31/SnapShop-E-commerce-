import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';
import FadeInView from '../components/FadeInView';
import AnimatedButton from '../components/AnimatedButton';

export default function EditProfileScreen() {
    const router = useRouter();
    const [name, setName] = useState('John Doe');
    const [email, setEmail] = useState('john.doe@email.com');
    const [phone, setPhone] = useState('+62 812 3456 7890');
    const [bio, setBio] = useState('Fashion enthusiast 🛍️');

    const handleSave = () => {
        Alert.alert('Success', 'Profile updated successfully!', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar */}
                <FadeInView delay={0}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity style={styles.cameraButton}>
                                <Ionicons name="camera" size={16} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </View>
                </FadeInView>

                {/* Form Fields */}
                <FadeInView delay={100}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={Colors.gray}
                        />
                    </View>
                </FadeInView>

                <FadeInView delay={150}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Email</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            placeholderTextColor={Colors.gray}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </FadeInView>

                <FadeInView delay={200}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.fieldInput}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter your phone"
                            placeholderTextColor={Colors.gray}
                            keyboardType="phone-pad"
                        />
                    </View>
                </FadeInView>

                <FadeInView delay={250}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Bio</Text>
                        <TextInput
                            style={[styles.fieldInput, styles.bioInput]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about yourself"
                            placeholderTextColor={Colors.gray}
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </FadeInView>

                {/* Change Password */}
                <FadeInView delay={300}>
                    <TouchableOpacity style={styles.changePasswordBtn}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.primaryText} />
                        <Text style={styles.changePasswordText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.gray} />
                    </TouchableOpacity>
                </FadeInView>

                {/* Save Button */}
                <FadeInView delay={350}>
                    <AnimatedButton
                        onPress={handleSave}
                        title="Save Changes"
                        style={styles.saveButton}
                        textStyle={styles.saveButtonText}
                    />
                </FadeInView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg,
    },
    headerTitle: { fontFamily: 'Inter_700Bold', fontSize: FontSize.xl, color: Colors.primaryText },
    scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
    avatarSection: { alignItems: 'center', marginVertical: Spacing.xl },
    avatarContainer: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    cameraButton: {
        position: 'absolute', bottom: 0, right: 0,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: Colors.white,
    },
    changePhotoText: { fontFamily: 'Inter_500Medium', fontSize: FontSize.sm, color: Colors.primary, marginTop: Spacing.sm },
    fieldGroup: { marginBottom: Spacing.xl },
    fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.sm, color: Colors.secondaryText, marginBottom: Spacing.sm },
    fieldInput: {
        fontFamily: 'Inter_400Regular', fontSize: FontSize.md, color: Colors.primaryText,
        backgroundColor: Colors.lightGray, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    bioInput: { height: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
    changePasswordBtn: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingVertical: Spacing.lg, borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: Colors.border, marginBottom: Spacing.xxl,
    },
    changePasswordText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: FontSize.md, color: Colors.primaryText },
    saveButton: {
        backgroundColor: Colors.primary, paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.xl, alignItems: 'center',
    },
    saveButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: FontSize.lg, color: Colors.white },
});
