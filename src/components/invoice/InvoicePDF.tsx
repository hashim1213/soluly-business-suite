import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Create styles - using Helvetica (built-in PDF font)
// Helvetica-Bold is used for bold text
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    maxHeight: 60,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#1a1a1a",
  },
  invoiceNumber: {
    fontSize: 12,
    textAlign: "right",
    color: "#666666",
    marginTop: 4,
  },
  companyInfo: {
    marginBottom: 30,
  },
  companyAddress: {
    fontSize: 10,
    color: "#666666",
    lineHeight: 1.6,
  },
  billToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  billToColumn: {
    width: "48%",
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  clientAddress: {
    fontSize: 10,
    color: "#444444",
    lineHeight: 1.6,
  },
  invoiceDetails: {
    alignItems: "flex-end",
  },
  invoiceDetailRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  invoiceDetailLabel: {
    fontSize: 10,
    color: "#666666",
    width: 80,
    textAlign: "right",
    marginRight: 10,
  },
  invoiceDetailValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
  },
  balanceDue: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  balanceDueLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  balanceDueValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a1a",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableColDescription: {
    width: "50%",
  },
  tableColQty: {
    width: "15%",
    textAlign: "center",
  },
  tableColRate: {
    width: "17.5%",
    textAlign: "right",
  },
  tableColAmount: {
    width: "17.5%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#444444",
  },
  tableCellText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  tableCellDescription: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: "auto",
    width: 250,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  totalLabel: {
    fontSize: 10,
    color: "#666666",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  footer: {
    marginTop: 40,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 10,
    color: "#444444",
    lineHeight: 1.6,
  },
  termsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  termsLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888888",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  termsText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.6,
  },
  // Additional styles for inline bold text
  boldText: {
    fontFamily: "Helvetica-Bold",
  },
});

// Type definitions for the invoice data
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceData {
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;

  // Company (seller) info
  companyName: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPostalCode?: string;
  companyCountry?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  taxNumber?: string;

  // Client (bill to) info
  clientName: string;
  clientAddress?: string;
  contactName?: string;
  contactEmail?: string;

  // Line items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amountPaid?: number;
  balanceDue: number;

  // Footer
  notes?: string;
  terms?: string;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Invoice PDF Component
export const InvoicePDF = ({ data }: { data: InvoiceData }) => {
  const companyFullAddress = [
    data.companyAddress,
    data.companyCity && data.companyState
      ? `${data.companyCity}, ${data.companyState} ${data.companyPostalCode || ""}`
      : data.companyCity || data.companyState,
    data.companyCountry,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {data.companyLogo ? (
              <Image src={data.companyLogo} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{data.companyName}</Text>
            )}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companyInfo}>
          {data.companyLogo && (
            <Text style={[styles.companyName, { marginBottom: 8 }]}>
              {data.companyName}
            </Text>
          )}
          <Text style={styles.companyAddress}>{companyFullAddress}</Text>
          {data.companyPhone && (
            <Text style={styles.companyAddress}>{data.companyPhone}</Text>
          )}
          {data.companyEmail && (
            <Text style={styles.companyAddress}>{data.companyEmail}</Text>
          )}
          {data.taxNumber && (
            <Text style={styles.companyAddress}>Tax ID: {data.taxNumber}</Text>
          )}
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
            {data.contactName && (
              <Text style={styles.clientAddress}>{data.contactName}</Text>
            )}
            {data.clientAddress && (
              <Text style={styles.clientAddress}>{data.clientAddress}</Text>
            )}
            {data.contactEmail && (
              <Text style={styles.clientAddress}>{data.contactEmail}</Text>
            )}
          </View>
          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Date:</Text>
              <Text style={styles.invoiceDetailValue}>
                {formatDate(data.invoiceDate)}
              </Text>
            </View>
            {data.dueDate && (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceDetailLabel}>Due Date:</Text>
                <Text style={styles.invoiceDetailValue}>
                  {formatDate(data.dueDate)}
                </Text>
              </View>
            )}
            {data.poNumber && (
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.invoiceDetailLabel}>PO Number:</Text>
                <Text style={styles.invoiceDetailValue}>{data.poNumber}</Text>
              </View>
            )}
            <View style={styles.balanceDue}>
              <View style={styles.invoiceDetailRow}>
                <Text style={styles.balanceDueLabel}>Balance Due:</Text>
                <Text style={styles.balanceDueValue}>
                  {formatCurrency(data.balanceDue)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableColDescription}>
              <Text style={styles.tableHeaderText}>Item</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={[styles.tableHeaderText, { textAlign: "center" }]}>
                Qty
              </Text>
            </View>
            <View style={styles.tableColRate}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
                Rate
              </Text>
            </View>
            <View style={styles.tableColAmount}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>
                Amount
              </Text>
            </View>
          </View>
          {data.lineItems.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableColDescription}>
                <Text style={styles.tableCellDescription}>
                  {item.description || "Item"}
                </Text>
              </View>
              <View style={styles.tableColQty}>
                <Text style={[styles.tableCellText, { textAlign: "center" }]}>
                  {item.quantity}
                </Text>
              </View>
              <View style={styles.tableColRate}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  {formatCurrency(item.unit_price)}
                </Text>
              </View>
              <View style={styles.tableColAmount}>
                <Text style={[styles.tableCellText, { textAlign: "right" }]}>
                  {formatCurrency(item.quantity * item.unit_price)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.subtotal)}
            </Text>
          </View>
          {(data.taxRate || data.taxAmount) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax {data.taxRate ? `(${data.taxRate}%)` : ""}
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.taxAmount || 0)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(data.total)}
            </Text>
          </View>
          {data.amountPaid && data.amountPaid > 0 && (
            <>
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text style={styles.totalLabel}>Amount Paid</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(data.amountPaid)}
                </Text>
              </View>
              <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.totalLabel, styles.boldText]}>
                  Balance Due
                </Text>
                <Text style={[styles.totalValue, { fontSize: 12 }]}>
                  {formatCurrency(data.balanceDue)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer - Notes and Terms */}
        <View style={styles.footer}>
          {data.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </View>
          )}
          {data.terms && (
            <View style={styles.termsSection}>
              <Text style={styles.termsLabel}>Terms</Text>
              <Text style={styles.termsText}>{data.terms}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
