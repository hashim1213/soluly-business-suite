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
    padding: 50,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  logo: {
    width: 60,
    maxHeight: 60,
    objectFit: "contain",
  },
  // Metadata rows
  metaSection: {
    marginBottom: 28,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    width: 110,
    color: "#1a1a1a",
  },
  metaValue: {
    fontSize: 10,
    color: "#333333",
  },
  // Two-column: Company | Bill To
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  colLeft: {
    width: "48%",
  },
  colRight: {
    width: "48%",
  },
  colTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  colText: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.6,
  },
  // Due banner
  dueBanner: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  // Notes/terms above table
  preTableNotes: {
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
    marginBottom: 24,
  },
  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 9,
    color: "#555555",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
    paddingVertical: 10,
  },
  colDesc: { width: "45%" },
  colQty: { width: "10%", textAlign: "center" },
  colUnitPrice: { width: "18%", textAlign: "right" },
  colTax: { width: "12%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
  cellText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  cellSubText: {
    fontSize: 9,
    color: "#666666",
    marginTop: 2,
  },
  // Totals
  totalsSection: {
    marginLeft: "auto",
    width: 260,
    marginTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#333333",
  },
  totalValue: {
    fontSize: 10,
    color: "#1a1a1a",
    textAlign: "right",
  },
  totalRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    marginTop: 4,
  },
  totalLabelBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
  },
  totalValueBold: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#1a1a1a",
    textAlign: "right",
  },
  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#555555",
    marginBottom: 4,
    marginTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.6,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 50,
    fontSize: 9,
    color: "#999999",
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
    month: "long",
    day: "numeric",
  });
};

export const InvoicePDF = ({ data }: { data: InvoiceData }) => {
  const companyLines = [
    data.companyAddress,
    [data.companyCity, data.companyState, data.companyPostalCode].filter(Boolean).join(", "),
    data.companyCountry,
    data.companyEmail,
  ].filter(Boolean);

  const clientLines = [
    data.clientAddress,
    [data.clientCity, data.clientState, data.clientPostalCode].filter(Boolean).join(", "),
    data.clientCountry,
    data.contactEmail,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header: Title left, Logo right */}
        <View style={styles.headerRow}>
          <Text style={styles.invoiceTitle}>Invoice</Text>
          {data.companyLogo && <Image src={data.companyLogo} style={styles.logo} />}
        </View>

        {/* Invoice metadata */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice number</Text>
            <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date of issue</Text>
            <Text style={styles.metaValue}>{formatDate(data.invoiceDate)}</Text>
          </View>
          {data.dueDate && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date due</Text>
              <Text style={styles.metaValue}>{formatDate(data.dueDate)}</Text>
            </View>
          )}
          {data.taxNumber && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tax Registration</Text>
              <Text style={styles.metaValue}>{data.taxNumber}</Text>
            </View>
          )}
          {data.poNumber && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>PO Number</Text>
              <Text style={styles.metaValue}>{data.poNumber}</Text>
            </View>
          )}
        </View>

        {/* Two columns: Company | Bill To */}
        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.colTitle}>{data.companyName}</Text>
            {companyLines.map((line, i) => (
              <Text key={i} style={styles.colText}>{line}</Text>
            ))}
          </View>
          <View style={styles.colRight}>
            <Text style={styles.colTitle}>Bill to</Text>
            <Text style={styles.colText}>{data.clientName}</Text>
            {data.contactName && <Text style={styles.colText}>{data.contactName}</Text>}
            {clientLines.map((line, i) => (
              <Text key={i} style={styles.colText}>{line}</Text>
            ))}
          </View>
        </View>

        {/* Amount due banner */}
        <Text style={styles.dueBanner}>
          {formatCurrency(data.balanceDue)} due {data.dueDate ? formatDate(data.dueDate) : "upon receipt"}
        </Text>

        {/* Notes (payment instructions etc) */}
        {data.notes && (
          <Text style={styles.preTableNotes}>{data.notes}</Text>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={[styles.tableHeaderText, { textAlign: "center" }]}>Qty</Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Unit price</Text>
            </View>
            <View style={styles.colTax}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Tax</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={[styles.tableHeaderText, { textAlign: "right" }]}>Amount</Text>
            </View>
          </View>
          {data.lineItems.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.colDesc}>
                <Text style={styles.cellText}>{item.description || "Item"}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>{item.quantity}</Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text style={[styles.cellText, { textAlign: "right" }]}>{formatCurrency(item.unit_price)}</Text>
              </View>
              <View style={styles.colTax}>
                <Text style={[styles.cellText, { textAlign: "right" }]}>{data.taxRate ? `${data.taxRate}%` : "0%"}</Text>
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
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
          </View>
          {(data.taxRate || data.taxAmount) ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({data.taxRate ?? 0}%{data.taxRate ? ` on ${formatCurrency(data.subtotal)}` : ""})
              </Text>
              <Text style={styles.totalValue}>{formatCurrency(data.taxAmount ?? 0)}</Text>
            </View>
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax (0%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(0)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.total)}</Text>
          </View>
          {data.amountPaid && data.amountPaid > 0 ? (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount paid</Text>
                <Text style={styles.totalValue}>-{formatCurrency(data.amountPaid)}</Text>
              </View>
              <View style={styles.totalRowBold}>
                <Text style={styles.totalLabelBold}>Amount due</Text>
                <Text style={styles.totalValueBold}>{formatCurrency(data.balanceDue)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.totalRowBold}>
              <Text style={styles.totalLabelBold}>Amount due</Text>
              <Text style={styles.totalValueBold}>{formatCurrency(data.balanceDue)}</Text>
            </View>
          )}
        </View>

        {/* Terms in footer */}
        {data.terms && (
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Terms</Text>
            <Text style={styles.footerText}>{data.terms}</Text>
          </View>
        )}

        {/* Page number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};

export default InvoicePDF;
