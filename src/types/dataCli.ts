// Thêm interface định nghĩa kiểu dữ liệu cho package
interface PackageInfo {
    version: string;
    description: string;
    homepage?: string;
    license: string;
    pname: string;
    type: string;
}

export default PackageInfo;