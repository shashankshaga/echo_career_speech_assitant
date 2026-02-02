import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LinearGradient } from "expo-linear-gradient";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface Contact {
  id: number;
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
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    initDatabase();
  }, []);

  async function initDatabase() {
    try {
      const database = await SQLite.openDatabaseAsync("contacts.db");
      setDb(database);

      // Create table if it doesn't exist
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          companyName TEXT NOT NULL,
          contactName TEXT NOT NULL,
          additionalInfo TEXT,
          dateCreated TEXT NOT NULL
        );
      `);

      loadContacts(database);
    } catch (error) {
      console.error("Error initializing database:", error);
      Alert.alert("Database Error", "Failed to initialize database");
    }
  }

  async function loadContacts(database?: SQLite.SQLiteDatabase) {
    try {
      const activeDb = database || db;
      if (!activeDb) return;

      const result = await activeDb.getAllAsync<Contact>(
        "SELECT * FROM contacts ORDER BY id DESC",
      );
      setContacts(result);
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

    if (!db) {
      Alert.alert("Error", "Database not initialized");
      return;
    }

    setIsLoading(true);

    try {
      await db.runAsync(
        "INSERT INTO contacts (companyName, contactName, additionalInfo, dateCreated) VALUES (?, ?, ?, ?)",
        [
          companyName.trim(),
          contactName.trim(),
          additionalInfo.trim(),
          new Date().toLocaleDateString(),
        ],
      );

      // Reload contacts
      await loadContacts();

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

  async function deleteContact(id: number) {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!db) return;
            try {
              await db.runAsync("DELETE FROM contacts WHERE id = ?", [id]);
              await loadContacts();
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Error", "Failed to delete contact");
            }
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
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {contacts.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>CONTACTS</ThemedText>
            </View>
          </View>
        </View>

        {!showForm ? (
          <>
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={styles.createButtonContainer}
            >
              <LinearGradient
                colors={["#FF6B00", "#FF9500", "#FFB800"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButton}
              >
                <ThemedText style={styles.createButtonText}>
                  ✦ CREATE NEW CONTACT
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchWrapper}>
                <ThemedText style={styles.searchIcon}>🔍</ThemedText>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by company name..."
                  placeholderTextColor="#555"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <ThemedText style={styles.clearIcon}>✕</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ThemedView style={styles.contactsSection}>
              <ThemedText style={styles.sectionLabel}>
                {searchQuery
                  ? `SEARCH RESULTS · ${filteredContacts.length}`
                  : `ALL CONTACTS · ${contacts.length}`}
              </ThemedText>

              {filteredContacts.length === 0 ? (
                <ThemedView style={styles.emptyState}>
                  <ThemedText style={styles.emptyIcon}>
                    {searchQuery ? "🔍" : "📇"}
                  </ThemedText>
                  <ThemedText style={styles.emptyTitle}>
                    {searchQuery ? "No Results Found" : "No Contacts Yet"}
                  </ThemedText>
                  <ThemedText style={styles.emptyText}>
                    {searchQuery
                      ? "Try searching for a different company name"
                      : "Create your first contact to get started"}
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
                          👤 {contact.contactName}
                        </ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteContact(contact.id)}
                        style={styles.deleteButton}
                      >
                        <ThemedText style={styles.deleteButtonText}>
                          ✕
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                    {contact.additionalInfo ? (
                      <View style={styles.notesContainer}>
                        <ThemedText style={styles.contactNotes}>
                          {contact.additionalInfo}
                        </ThemedText>
                      </View>
                    ) : null}
                    <View style={styles.contactFooter}>
                      <ThemedText style={styles.contactDate}>
                        📅 {contact.dateCreated}
                      </ThemedText>
                    </View>
                  </ThemedView>
                ))
              )}
            </ThemedView>
          </>
        ) : (
          <ThemedView style={styles.formContainer}>
            <View style={styles.formHeader}>
              <ThemedText style={styles.formTitle}>✦ NEW CONTACT</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowForm(false);
                  setCompanyName("");
                  setContactName("");
                  setAdditionalInfo("");
                }}
                style={styles.closeButton}
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.formDivider} />

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>
                COMPANY NAME <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g., Google, Microsoft, Amazon..."
                  placeholderTextColor="#555"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>
                CONTACT NAME <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="e.g., John Smith, Jane Doe..."
                  placeholderTextColor="#555"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>ADDITIONAL NOTES</ThemedText>
              <ThemedText style={styles.formHint}>
                💡 Paste feedback from Intel Coach or add your own notes
              </ThemedText>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={additionalInfo}
                  onChangeText={setAdditionalInfo}
                  placeholder="Notes about the conversation, feedback, follow-up items, next steps..."
                  placeholderTextColor="#555"
                  multiline
                  numberOfLines={6}
                />
              </View>
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
                  colors={["#FF6B00", "#FF9500", "#FFB800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButton}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {isLoading ? "⏳ SAVING..." : "✓ SAVE CONTACT"}
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
    backgroundColor: "#000000",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  brandText: {
    color: "#FF6B00",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    paddingTop: 8,
  },
  statsBar: {
    flexDirection: "row",
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B00",
  },
  statNumber: {
    color: "#FF6B00",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#666",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  createButtonContainer: {
    marginBottom: 24,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  searchContainer: {
    marginBottom: 28,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    paddingVertical: 16,
    fontSize: 15,
  },
  clearIcon: {
    color: "#666",
    fontSize: 18,
    paddingLeft: 12,
  },
  contactsSection: {
    gap: 12,
  },
  sectionLabel: {
    color: "#FF6B00",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  emptyState: {
    padding: 60,
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
    borderStyle: "dashed",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: "#0A0A0A",
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B00",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  contactName: {
    color: "#FF9500",
    fontSize: 14,
    fontWeight: "600",
  },
  notesContainer: {
    backgroundColor: "#050505",
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#333",
  },
  contactNotes: {
    color: "#BBB",
    fontSize: 13,
    lineHeight: 20,
  },
  contactFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
  },
  contactDate: {
    color: "#555",
    fontSize: 11,
  },
  deleteButton: {
    backgroundColor: "#1A0000",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF1A1A",
  },
  deleteButtonText: {
    color: "#FF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  formContainer: {
    backgroundColor: "#0A0A0A",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FF6B00",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
  },
  closeButton: {
    backgroundColor: "#1A1A1A",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "700",
  },
  formDivider: {
    height: 2,
    backgroundColor: "#1A1A1A",
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    color: "#FF6B00",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  required: {
    color: "#FF4444",
  },
  formHint: {
    color: "#666",
    fontSize: 11,
    marginBottom: 10,
    fontStyle: "italic",
  },
  inputWrapper: {
    backgroundColor: "#050505",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  input: {
    color: "#FFFFFF",
    padding: 16,
    fontSize: 15,
  },
  textAreaWrapper: {
    minHeight: 140,
  },
  textArea: {
    height: 140,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  saveButtonContainer: {
    flex: 1,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
