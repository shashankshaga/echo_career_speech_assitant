import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CONTACTS_STORAGE_KEY = "career_coach_contacts";

interface Contact {
  id: string;
  companyName: string;
  contactName: string;
  additionalInfo: string;
  dateCreated: string;
}

export default function TabTwoScreen() {
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const saved = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved) {
        setContacts(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  }

  async function saveContact() {
    if (!companyName.trim() || !contactName.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in company name and contact name.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const newContact: Contact = {
        id: Date.now().toString(),
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        additionalInfo: additionalInfo.trim(),
        dateCreated: new Date().toLocaleDateString(),
      };

      const updatedContacts = [newContact, ...contacts];
      await AsyncStorage.setItem(
        CONTACTS_STORAGE_KEY,
        JSON.stringify(updatedContacts),
      );
      setContacts(updatedContacts);

      // Reset form
      setCompanyName("");
      setContactName("");
      setAdditionalInfo("");
      setShowForm(false);

      Alert.alert("Success", "Contact saved successfully!");
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteContact(id: string) {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedContacts = contacts.filter((c) => c.id !== id);
            await AsyncStorage.setItem(
              CONTACTS_STORAGE_KEY,
              JSON.stringify(updatedContacts),
            );
            setContacts(updatedContacts);
          },
        },
      ],
    );
  }

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) =>
    contact.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.brandText}>CONTACT MANAGER</ThemedText>
          <ThemedText style={styles.titleText}>NETWORKING</ThemedText>
        </View>

        {!showForm ? (
          <>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={styles.createButtonContainer}
            >
              <LinearGradient
                colors={["#FF6B00", "#FF9500"]}
                style={styles.createButton}
              >
                <ThemedText style={styles.createButtonText}>
                  + CREATE CONTACT
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <ThemedText style={styles.searchLabel}>
                🔍 SEARCH BY COMPANY
              </ThemedText>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Type company name..."
                placeholderTextColor="#666"
              />
            </View>

            <ThemedView style={styles.contactsSection}>
              <ThemedText style={styles.sectionLabel}>
                {searchQuery
                  ? `RESULTS (${filteredContacts.length})`
                  : `SAVED CONTACTS (${contacts.length})`}
              </ThemedText>

              {filteredContacts.length === 0 ? (
                <ThemedView style={styles.emptyState}>
                  <ThemedText style={styles.emptyText}>
                    {searchQuery
                      ? "No contacts found for this company."
                      : "No contacts yet. Create your first contact!"}
                  </ThemedText>
                </ThemedView>
              ) : (
                filteredContacts.map((contact) => (
                  <ThemedView key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <View style={styles.contactInfo}>
                        <ThemedText style={styles.contactCompany}>
                          {contact.companyName}
                        </ThemedText>
                        <ThemedText style={styles.contactName}>
                          {contact.contactName}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteContact(contact.id)}
                        style={styles.deleteButton}
                      >
                        <ThemedText style={styles.deleteButtonText}>
                          DELETE
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    {contact.additionalInfo ? (
                      <ThemedText style={styles.contactNotes}>
                        {contact.additionalInfo}
                      </ThemedText>
                    ) : null}
                    <ThemedText style={styles.contactDate}>
                      Added: {contact.dateCreated}
                    </ThemedText>
                  </ThemedView>
                ))
              )}
            </ThemedView>
          </>
        ) : (
          <ThemedView style={styles.formContainer}>
            <ThemedText style={styles.formTitle}>NEW CONTACT</ThemedText>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>COMPANY NAME *</ThemedText>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g., Google, Microsoft, etc."
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>CONTACT NAME *</ThemedText>
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="e.g., John Smith"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>ADDITIONAL INFO</ThemedText>
              <ThemedText style={styles.formHint}>
                Tip: Copy feedback from Intel Coach and paste here
              </ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={additionalInfo}
                onChangeText={setAdditionalInfo}
                placeholder="Notes about the conversation, feedback, follow-up items, etc."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setCompanyName("");
                  setContactName("");
                  setAdditionalInfo("");
                }}
                style={styles.cancelButton}
              >
                <ThemedText style={styles.cancelButtonText}>CANCEL</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveContact}
                disabled={isLoading}
                style={styles.saveButtonContainer}
              >
                <LinearGradient
                  colors={["#FF6B00", "#FF9500"]}
                  style={styles.saveButton}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {isLoading ? "SAVING..." : "SAVE CONTACT"}
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 30,
  },
  brandText: {
    color: "#FF6B00",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 3,
    marginBottom: 4,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    paddingTop: 15,
  },
  createButtonContainer: {
    marginBottom: 20,
  },
  createButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchLabel: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  searchInput: {
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    padding: 16,
    borderRadius: 4,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  contactsSection: {
    gap: 16,
  },
  sectionLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyState: {
    padding: 40,
    backgroundColor: "#111",
    borderRadius: 8,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  contactCard: {
    backgroundColor: "#111",
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B00",
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactCompany: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  contactName: {
    color: "#FF6B00",
    fontSize: 14,
    fontWeight: "600",
  },
  contactNotes: {
    color: "#AAA",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  contactDate: {
    color: "#666",
    fontSize: 11,
    marginTop: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FF1A1A",
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "900",
  },
  formContainer: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 8,
    borderTopWidth: 3,
    borderTopColor: "#FF6B00",
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 24,
    letterSpacing: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  formHint: {
    color: "#666",
    fontSize: 10,
    marginBottom: 8,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    padding: 16,
    borderRadius: 4,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  cancelButtonText: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "900",
  },
  saveButtonContainer: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
