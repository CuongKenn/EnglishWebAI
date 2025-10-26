import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { FileText, Video, Upload, Plus, Search, Download } from 'lucide-react';
import './SharedComponents.css';

const MaterialsManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const mockMaterials = [
    {
      id: 1,
      title: 'Unit 5 - Daily Activities - Lesson Plan',
      type: 'document',
      class: '10A1',
      size: '2.5 MB',
      uploadDate: '20/10/2025',
      downloads: 15
    },
    {
      id: 2,
      title: 'Grammar - Present Perfect Tense',
      type: 'document',
      class: 'All',
      size: '1.2 MB',
      uploadDate: '18/10/2025',
      downloads: 32
    },
    {
      id: 3,
      title: 'Video Tutorial - Speaking Skills',
      type: 'video',
      class: 'All',
      size: '45.2 MB',
      uploadDate: '12/10/2025',
      downloads: 42
    }
  ];

  return (
    <div className="component-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Học liệu</h1>
          <p className="page-subtitle">Quản lý tài liệu giảng dạy và học liệu</p>
        </div>
      </div>

      <Card className="toolbar-card">
        <div className="toolbar-content">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <Input
              placeholder="Tìm kiếm học liệu..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Upload size={16} />
            Upload học liệu
          </Button>
        </div>
      </Card>

      <div className="items-list">
        {mockMaterials.map((material) => (
          <Card key={material.id} className="item-card">
            <div className="material-icon">
              {material.type === 'video' ? (
                <Video size={32} color="#8b5cf6" />
              ) : (
                <FileText size={32} color="#3b82f6" />
              )}
            </div>
            <div className="item-info flex-1">
              <h3 className="item-title">{material.title}</h3>
              <div className="item-meta">
                <span>{material.class}</span>
                <span>•</span>
                <span>{material.size}</span>
                <span>•</span>
                <span>{material.uploadDate}</span>
                <span>•</span>
                <span>{material.downloads} lượt tải</span>
              </div>
            </div>
            <div className="item-actions">
              <Button variant="outline" size="sm">
                <Download size={16} />
                Tải về
              </Button>
              <Button variant="outline" size="sm">
                Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MaterialsManagement;

