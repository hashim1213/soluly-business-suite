import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  // Header: logo left, INVOICE right
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  logo: {
    width: 140,
    maxHeight: 50,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  invoiceTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    color: "#1a1a1a",
  },
  invoiceNumber: {
    fontSize: 11,
    textAlign: "right",
    color: "#555555",
    marginTop: 2,
  },
  // Company address (below header, left side)
  companyAddress: {
    fontSize: 10,
    color: "#444444",
    lineHeight: 1.5,
    marginBottom: 20,
  },
  // Middle section: Bill To (left) + Date/Due/Balance (right)
  middleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  billToBlock: {
    width: "55%",
  },
  billToLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  // Right details column
  detailsBlock: {
    width: "40%",
    alignItems: "flex-end",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 10,
    color: "#666666",
    width: 70,
    textAlign: "right",
  },
  detailValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
  },
  balanceDueRow: {
    flexDirection: "row",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
  },
  balanceDueLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    width: 90,
    textAlign: "right",
    color: "#1a1a1a",
  },
  balanceDueValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
    color: "#1a1a1a",
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4a7c59",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  colItem: {
    width: "50%",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colRate: {
    width: "17.5%",
    textAlign: "right",
  },
  colAmount: {
    width: "17.5%",
    textAlign: "right",
  },
  cellText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  // Totals
  totalsSection: {
    marginTop: 20,
    marginLeft: "auto",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  // Footer
  footer: {
    marginTop: 40,
  },
  notesBlock: {
    marginBottom: 16,
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#666666",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.6,
  },
  termsBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
});

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  poNumber?: string;

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

  clientName: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientPostalCode?: string;
  clientCountry?: string;
  contactName?: string;
  contactEmail?: string;

  lineItems: InvoiceLineItem[];

  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  amountPaid?: number;
  balanceDue: number;

  notes?: string;
  terms?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const d = dateString.includes("T") ? new Date(dateString) : new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const InvoicePDF = ({ data }: { data: InvoiceData }) => {
  const companyAddressLines = [
    data.companyAddress,
    [data.companyCity, data.companyState, data.companyPostalCode].filter(Boolean).join(", "),
    data.companyCountry,
  ].filter(Boolean).join("\n");

  const clientAddressLines = [
    data.clientAddress,
    [data.clientCity, data.clientState, data.clientPostalCode].filter(Boolean).join(", "),
    data.clientCountry,
  ].filter(Boolean).join("\n");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Logo/Name left, INVOICE right */}
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
            <Text style={styles.invoiceNumber}># {data.invoiceNumber}</Text>
          </View>
        </View>

        {/* Company address */}
        <View style={{ marginBottom: 16 }}>
          {data.companyLogo && (
            <Text style={[styles.companyName, { fontSize: 11, marginBottom: 2 }]}>{data.companyName}</Text>
          )}
          {companyAddressLines ? <Text style={styles.companyAddress}>{companyAddressLines}</Text> : null}
          {data.companyPhone && <Text style={styles.companyAddress}>{data.companyPhone}</Text>}
          {data.companyEmail && <Text style={styles.companyAddress}>{data.companyEmail}</Text>}
          {data.taxNumber && <Text style={styles.companyAddress}>Tax ID: {data.taxNumber}</Text>}
        </View>

        {/* Middle: Bill To (left) + Date/Due/Balance (right) */}
        <View style={styles.middleSection}>
          <View style={styles.billToBlock}>
            <Text style={styles.billToLabel}>Bill To:</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
            {data.contactName && <Text style={styles.clientDetail}>{data.contactName}</Text>}
            {clientAddressLines ? <Text style={styles.clientDetail}>{clientAddressLines}</Text> : null}
            {data.contactEmail && <Text style={styles.clientDetail}>{data.contactEmail}</Text>}
          </View>
          <View style={styles.detailsBlock}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(data.invoiceDate)}</Text>
            </View>
            {data.dueDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{formatDate(data.dueDate)}</Text>
              </View>
            )}
            {data.poNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PO #:</Text>
                <Text style={styles.detailValue}>{data.poNumber}</Text>
              </View>
            )}
            <View style={styles.balanceDueRow}>
              <Text style={styles.balanceDueLabel}>Balance Due:</Text>
              <Text style={styles.balanceDueValue}>{formatCurrency(data.balanceDue)}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colItem}>
              <Text style={styles.tableHeaderText}>Item</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.tableHeaderText, { textAlign: "center" }]}>Quantity</Text>
            </View>
            <View style={styles.colRate}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Rate</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Amount</Text>
            </View>
          </View>
          {data.lineItems.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.colItem}>
                <Text style={styles.cellText}>{item.description || "Item"}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>{item.quantity}</Text>
              </View>
              <View style={styles.colRate}>
                <Text style={[styles.cellText, { textAlign: "right" }]}>{formatCurrency(item.unit_price)}</Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={[styles.cellText, { textAlign: "right" }]}>{formatCurrency(item.quantity * item.unit_price)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({data.taxRate ?? 0}%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.taxAmount ?? 0)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
          </View>
          {data.amountPaid && data.amountPaid > 0 ? (
            <>
              <View style={[styles.totalRow, { marginTop: 4 }]}>
                <Text style={styles.totalLabel}>Amount Paid:</Text>
                <Text style={styles.totalValue}>-{formatCurrency(data.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { fontFamily: "Helvetica-Bold" }]}>Balance Due:</Text>
                <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(data.balanceDue)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Footer: Notes & Terms */}
        <View style={styles.footer}>
          {data.notes && (
            <View style={styles.notesBlock}>
              <Text style={styles.footerLabel}>Notes:</Text>
              <Text style={styles.footerText}>{data.notes}</Text>
            </View>
          )}
          {data.terms && (
            <View style={styles.termsBlock}>
              <Text style={styles.footerLabel}>Terms:</Text>
              <Text style={styles.footerText}>{data.terms}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
