import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '../constants/theme';

export default function NotFoundScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Page Not Found</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
                <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.xl,
        color: Colors.primaryText,
        marginBottom: Spacing.xxl,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.xl,
    },
    buttonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: FontSize.md,
        color: Colors.white,
    },
});
