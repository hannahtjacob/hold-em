import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DeviceActivity from 'react-native-device-activity';

const SELECTION_ID = 'focus-apps';

type AuthorizationStatus = ReturnType<typeof DeviceActivity.getAuthorizationStatus>;

export function HomeScreen() {
  const [authorizationStatus, setAuthorizationStatus] =
    useState<AuthorizationStatus>(DeviceActivity.AuthorizationStatus.notDetermined);
  const [hasSelection, setHasSelection] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const isSupported = Platform.OS === 'ios' && DeviceActivity.isAvailable();

  useEffect(() => {
    if (!isSupported) return;

    setAuthorizationStatus(DeviceActivity.getAuthorizationStatus());
    setHasSelection(Boolean(DeviceActivity.getFamilyActivitySelectionId(SELECTION_ID)));
    setIsBlocking(DeviceActivity.isShieldActive());
  }, [isSupported]);

  const requestAccess = async () => {
    setIsWorking(true);
    try {
      await DeviceActivity.requestAuthorization('individual');
      setAuthorizationStatus(await DeviceActivity.pollAuthorizationStatus());
    } catch (error) {
      Alert.alert('Screen Time access failed', getErrorMessage(error));
    } finally {
      setIsWorking(false);
    }
  };

  const blockSelectedApps = () => {
    try {
      DeviceActivity.updateShield(
        {
          title: 'Focus time',
          subtitle: 'This app is paused until you end your focus session.',
          primaryButtonLabel: 'OK',
          iconSystemName: 'timer',
        },
        { primary: { behavior: 'close', type: 'dismiss' } },
      );
      DeviceActivity.blockSelection({ activitySelectionId: SELECTION_ID });
      setIsBlocking(true);
    } catch (error) {
      Alert.alert('Could not block apps', getErrorMessage(error));
    }
  };

  const unblockSelectedApps = () => {
    try {
      DeviceActivity.unblockSelection({ activitySelectionId: SELECTION_ID });
      setIsBlocking(false);
    } catch (error) {
      Alert.alert('Could not unblock apps', getErrorMessage(error));
    }
  };

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.eyebrow}>SCREEN TIME</Text>
        <Text style={styles.title}>Focus controls</Text>
        <View style={styles.notice}>
          <MaterialCommunityIcons color="#74c69d" name="cellphone-lock" size={30} />
          <Text style={styles.noticeTitle}>iPhone development build required</Text>
          <Text style={styles.noticeBody}>
            Apple Screen Time controls are unavailable in Expo Go and do not run in a
            browser. Install a signed development build on an iPhone to use this page.
          </Text>
        </View>
      </View>
    );
  }

  const isAuthorized = authorizationStatus === DeviceActivity.AuthorizationStatus.approved;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SCREEN TIME</Text>
      <Text style={styles.title}>Focus controls</Text>
      <Text style={styles.subtitle}>
        Choose distracting apps, then pause them whenever you want to focus.
      </Text>

      <View style={styles.card}>
        <Step
          complete={isAuthorized}
          description="Allow Hold Em to manage apps you choose."
          title="Allow Screen Time access"
        />
        <ActionButton
          disabled={isWorking || isAuthorized}
          label={isAuthorized ? 'Access allowed' : 'Allow access'}
          loading={isWorking}
          onPress={requestAccess}
        />

        <View style={styles.divider} />

        <Step
          complete={hasSelection}
          description="Apple keeps your selection private on this device."
          title="Choose apps to pause"
        />
        <ActionButton
          disabled={!isAuthorized}
          label={hasSelection ? 'Change selected apps' : 'Choose apps'}
          onPress={() => setIsPickerVisible(true)}
          secondary
        />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!hasSelection}
        onPress={isBlocking ? unblockSelectedApps : blockSelectedApps}
        style={({ pressed }) => [
          styles.focusButton,
          isBlocking && styles.stopButton,
          !hasSelection && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          color="#fff"
          name={isBlocking ? 'stop-circle-outline' : 'timer-play-outline'}
          size={23}
        />
        <Text style={styles.focusButtonText}>
          {isBlocking ? 'End focus session' : 'Start focus session'}
        </Text>
      </Pressable>

      {isBlocking && <Text style={styles.activeMessage}>Selected apps are currently paused.</Text>}

      <Modal
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
        presentationStyle="pageSheet"
        visible={isPickerVisible}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Choose apps</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsPickerVisible(false)}
              style={styles.doneButton}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
          <DeviceActivity.DeviceActivitySelectionViewPersisted
            familyActivitySelectionId={SELECTION_ID}
            onSelectionChange={(event) => {
              const selectionCount =
                event.nativeEvent.applicationCount +
                event.nativeEvent.categoryCount +
                event.nativeEvent.webDomainCount;
              setHasSelection(selectionCount > 0);
            }}
            style={styles.picker}
          />
        </View>
      </Modal>
    </View>
  );
}

type StepProps = {
  complete: boolean;
  description: string;
  title: string;
};

function Step({ complete, description, title }: StepProps) {
  return (
    <View style={styles.step}>
      <MaterialCommunityIcons
        color={complete ? '#2d6a4f' : '#829c91'}
        name={complete ? 'check-circle' : 'circle-outline'}
        size={24}
      />
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

type ActionButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  secondary?: boolean;
};

function ActionButton({ disabled, label, loading, onPress, secondary }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.secondaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? '#2d6a4f' : '#fff'} />
      ) : (
        <Text style={[styles.actionButtonText, secondary && styles.secondaryButtonText]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again on your iPhone.';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#081c15',
    flex: 1,
    padding: 24,
    paddingTop: 34,
  },
  eyebrow: {
    color: '#74c69d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: '#f7f3e8',
    fontSize: 36,
    fontWeight: '800',
    marginTop: 7,
  },
  subtitle: {
    color: '#a8bdb4',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#f7f3e8',
    borderRadius: 22,
    marginTop: 28,
    padding: 20,
  },
  step: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  stepCopy: {
    flex: 1,
  },
  stepTitle: {
    color: '#081c15',
    fontSize: 17,
    fontWeight: '700',
  },
  stepDescription: {
    color: '#66776f',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  divider: {
    backgroundColor: '#ded9ca',
    height: 1,
    marginVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 45,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: '#e2eadf',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#245640',
  },
  focusButton: {
    alignItems: 'center',
    backgroundColor: '#d62828',
    borderRadius: 15,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 54,
    paddingHorizontal: 20,
  },
  stopButton: {
    backgroundColor: '#40534a',
  },
  focusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  activeMessage: {
    color: '#a8bdb4',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
  pickerContainer: {
    backgroundColor: '#f7f3e8',
    flex: 1,
  },
  pickerHeader: {
    alignItems: 'center',
    borderBottomColor: '#ded9ca',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pickerTitle: {
    color: '#081c15',
    fontSize: 20,
    fontWeight: '800',
  },
  doneButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  doneButtonText: {
    color: '#2d6a4f',
    fontSize: 16,
    fontWeight: '700',
  },
  picker: {
    flex: 1,
    width: '100%',
  },
  notice: {
    alignItems: 'flex-start',
    backgroundColor: '#123c2e',
    borderColor: '#245c47',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 28,
    padding: 20,
  },
  noticeTitle: {
    color: '#f7f3e8',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  noticeBody: {
    color: '#a8bdb4',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },
});
